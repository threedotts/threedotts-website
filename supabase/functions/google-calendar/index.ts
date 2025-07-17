import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string }>;
}

interface AvailabilityRequest {
  date: string;
  timeZone: string;
}

interface BookingRequest {
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { action, ...data } = await req.json();

    // Get Google Calendar credentials
    const serviceAccountKey = Deno.env.get('GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      throw new Error('Google Calendar service account key not configured');
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (parseError) {
      throw new Error('Invalid Google Calendar service account JSON. Please ensure you have uploaded the complete Service Account JSON file, not just an API key.');
    }
    const accessToken = await getAccessToken(credentials);

    switch (action) {
      case 'getAvailability':
        return await getAvailability(data as AvailabilityRequest, accessToken);
      
      case 'bookAppointment':
        return await bookAppointment(data as BookingRequest, accessToken, supabase);
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('Error in google-calendar function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function getAccessToken(credentials: any): Promise<string> {
  const jwtHeader = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Create JWT token (simplified - in production use a proper JWT library)
  const token = await createJWT(jwtHeader, jwtPayload, credentials.private_key);

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
    }),
  });

  const tokenData = await response.json();
  return tokenData.access_token;
}

async function createJWT(header: any, payload: any, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}`
  );

  // Import private key
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the data
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, data);
  const signatureArray = new Uint8Array(signature);
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray));

  return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.${signatureBase64}`;
}

async function getAvailability(data: AvailabilityRequest, accessToken: string): Promise<Response> {
  const calendarId = 'limatembe44@gmail.com';
  const { date, timeZone } = data;

  try {
    // Validate booking date constraints (minimum 3 days, maximum 60 days)
    const today = new Date();
    const requestedDate = new Date(date);
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 3);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 60);

    if (requestedDate < minDate) {
      return new Response(
        JSON.stringify({ 
          availableSlots: [], 
          error: 'Agendamento deve ser feito com pelo menos 3 dias de antecedência' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (requestedDate > maxDate) {
      return new Response(
        JSON.stringify({ 
          availableSlots: [], 
          error: 'Agendamento não pode ser feito para mais de 60 dias no futuro' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = requestedDate.getDay();
    
    // Define working hours based on day of week
    let workingHours = null;
    
    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      // Segunda a quinta: das 9 às 17
      workingHours = { start: 9, end: 17 };
    } else if (dayOfWeek === 5) {
      // Sexta: das 14:30 às 17
      workingHours = { start: 14.5, end: 17 };
    } else if (dayOfWeek === 6) {
      // Sábado: das 10 às 14
      workingHours = { start: 10, end: 14 };
    } else {
      // Domingo: não trabalha
      return new Response(
        JSON.stringify({ availableSlots: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Working hours for ${date} (day ${dayOfWeek}):`, workingHours);

    // Get existing events for the date to check conflicts and count appointments
    const startTime = new Date(`${date}T00:00:00.000Z`);
    const endTime = new Date(`${date}T23:59:59.999Z`);

    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
      new URLSearchParams({
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const events = await eventsResponse.json();
    console.log(`Found ${events.items?.length || 0} existing events for ${date}`);
    
    // Check if maximum daily appointments (4) is reached
    const existingAppointments = events.items?.length || 0;
    if (existingAppointments >= 4) {
      return new Response(
        JSON.stringify({ 
          availableSlots: [], 
          error: 'Limite diário de 4 reuniões atingido para esta data' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Generate time slots based on working hours
    let availableTimeSlots = [];
    
    if (workingHours.start % 1 === 0.5) {
      // Handle half-hour start (e.g., 14:30)
      const startHour = Math.floor(workingHours.start);
      availableTimeSlots.push({
        time: `${startHour.toString().padStart(2, '0')}:30`,
        display: `${startHour > 12 ? startHour - 12 : startHour}:30 ${startHour >= 12 ? 'PM' : 'AM'}`,
      });
      
      for (let hour = startHour + 1; hour < workingHours.end; hour++) {
        availableTimeSlots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          display: `${hour > 12 ? hour - 12 : hour === 12 ? 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        });
      }
    } else {
      // Regular hourly slots
      for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        availableTimeSlots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          display: `${hour > 12 ? hour - 12 : hour === 12 ? 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        });
      }
    }

    console.log(`Generated ${availableTimeSlots.length} time slots for ${date}`);

    // Filter out slots that conflict with existing events
    const bookedSlots = events.items?.map((event: any) => ({
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
    })) || [];

    const availableSlots = availableTimeSlots.filter(slot => {
      const slotStart = new Date(`${date}T${slot.time}:00`);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60000); // 1 hour duration

      // Check if slot conflicts with existing events
      const isBooked = bookedSlots.some((booked: any) => 
        (slotStart >= booked.start && slotStart < booked.end) ||
        (slotEnd > booked.start && slotEnd <= booked.end) ||
        (slotStart <= booked.start && slotEnd >= booked.end)
      );

      return !isBooked;
    });

    console.log(`Final available slots: ${availableSlots.length}`);

    return new Response(
      JSON.stringify({ availableSlots }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('Error fetching availability:', error);
    
    // Fallback to basic availability check
    const events = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
      new URLSearchParams({
        timeMin: new Date(`${date}T00:00:00.000Z`).toISOString(),
        timeMax: new Date(`${date}T23:59:59.999Z`).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    ).then(res => res.json());

    const businessHours = { start: 9, end: 17, duration: 60 };
    const availableSlots = [];
    const bookedSlots = events.items?.map((event: any) => ({
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
    })) || [];

    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      const slotStart = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00`);
      const slotEnd = new Date(slotStart.getTime() + businessHours.duration * 60000);

      const isBooked = bookedSlots.some((booked: any) => 
        (slotStart >= booked.start && slotStart < booked.end) ||
        (slotEnd > booked.start && slotEnd <= booked.end) ||
        (slotStart <= booked.start && slotEnd >= booked.end)
      );

      if (!isBooked) {
        availableSlots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          display: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        });
      }
    }

    return new Response(
      JSON.stringify({ availableSlots }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}

async function bookAppointment(
  data: BookingRequest,
  accessToken: string,
  supabase: any
): Promise<Response> {
  const { name, email, phone, date, time, notes } = data;
  const calendarId = 'limatembe44@gmail.com';

  // Create start and end times
  const [hours, minutes] = time.split(':').map(Number);
  const startDateTime = new Date(`${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60000); // 1 hour duration

  // Create Google Calendar event
  const event: GoogleCalendarEvent = {
    summary: `Consulta com ${name}`,
    description: `
Consulta gratuita agendada via website.

Cliente: ${name}
Email: ${email}
${phone ? `Telefone: ${phone}` : ''}
${notes ? `Observações: ${notes}` : ''}
    `.trim(),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    // Removed attendees to avoid permission issues with service accounts
  };

  // Create event in Google Calendar
  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!calendarResponse.ok) {
    const error = await calendarResponse.json();
    throw new Error(`Failed to create calendar event: ${error.error?.message || 'Unknown error'}`);
  }

  const createdEvent = await calendarResponse.json();

  // Save appointment to database
  const { data: appointment, error: dbError } = await supabase
    .from('appointments')
    .insert({
      name,
      email,
      phone,
      date,
      time,
      notes,
      google_event_id: createdEvent.id,
      status: 'confirmed',
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database error:', dbError);
    // Try to delete the calendar event if database save failed
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${createdEvent.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    throw new Error('Failed to save appointment to database');
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      appointment,
      eventId: createdEvent.id,
      eventLink: createdEvent.htmlLink
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
}

serve(handler);