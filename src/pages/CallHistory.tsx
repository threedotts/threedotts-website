import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Phone, Clock, MessageSquare, TrendingUp } from "lucide-react";

// Mock data - will be replaced with real data from database later
const mockCalls = [
  {
    id: "1",
    date: "2024-01-26",
    time: "14:30",
    agent: "Maria Silva",
    duration: "5m 23s",
    messageCount: 12,
    evaluationResult: "Excellent",
    customer: "João Santos",
    phone: "+55 11 98765-4321",
    purpose: "Product inquiry",
    notes: "Customer interested in premium package. Requested follow-up call.",
  },
  {
    id: "2",
    date: "2024-01-26",
    time: "13:15",
    agent: "Carlos Oliveira",
    duration: "8m 45s",
    messageCount: 18,
    evaluationResult: "Good",
    customer: "Ana Costa",
    phone: "+55 21 99876-5432",
    purpose: "Support request",
    notes: "Technical issue resolved. Customer satisfied with solution.",
  },
  {
    id: "3",
    date: "2024-01-26",
    time: "11:20",
    agent: "Fernanda Lima",
    duration: "3m 12s",
    messageCount: 8,
    evaluationResult: "Fair",
    customer: "Pedro Almeida",
    phone: "+55 31 97654-3210",
    purpose: "Billing question",
    notes: "Billing clarification provided. Customer needs to contact finance.",
  },
  {
    id: "4",
    date: "2024-01-25",
    time: "16:45",
    agent: "Roberto Santos",
    duration: "12m 18s",
    messageCount: 25,
    evaluationResult: "Excellent",
    customer: "Luciana Ferreira",
    phone: "+55 11 96543-2109",
    purpose: "New contract",
    notes: "New contract negotiated successfully. Customer signed annual plan.",
  },
  {
    id: "5",
    date: "2024-01-25",
    time: "15:30",
    agent: "Juliana Rocha",
    duration: "6m 55s",
    messageCount: 14,
    evaluationResult: "Poor",
    customer: "Marcos Souza",
    phone: "+55 85 95432-1098",
    purpose: "Complaint",
    notes: "Customer complaint about service delay. Escalated to supervisor.",
  },
];

const getEvaluationColor = (result: string) => {
  switch (result.toLowerCase()) {
    case "excellent":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "good":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "fair":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "poor":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export default function CallHistory() {
  const [selectedCall, setSelectedCall] = useState<typeof mockCalls[0] | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleCallClick = (call: typeof mockCalls[0]) => {
    setSelectedCall(call);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedCall(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Call History</h1>
        <p className="text-muted-foreground">
          View and analyze all call center interactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Recent Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Evaluation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCalls.map((call) => (
                <TableRow 
                  key={call.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleCallClick(call)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{call.date}</div>
                      <div className="text-sm text-muted-foreground">{call.time}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{call.agent}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {call.duration}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      {call.messageCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getEvaluationColor(call.evaluationResult)}>
                      {call.evaluationResult}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCallClick(call);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Call Details Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Call Details</SheetTitle>
          </SheetHeader>
          
          {selectedCall && (
            <div className="mt-6 space-y-6">
              {/* Call Overview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Call Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p className="text-sm">{selectedCall.date}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Time</label>
                    <p className="text-sm">{selectedCall.time}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duration</label>
                    <p className="text-sm flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedCall.duration}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Messages</label>
                    <p className="text-sm flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {selectedCall.messageCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{selectedCall.customer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm">{selectedCall.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                    <p className="text-sm">{selectedCall.purpose}</p>
                  </div>
                </div>
              </div>

              {/* Agent & Evaluation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Agent & Evaluation</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Agent</label>
                    <p className="text-sm">{selectedCall.agent}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Evaluation Result</label>
                    <Badge className={getEvaluationColor(selectedCall.evaluationResult)}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {selectedCall.evaluationResult}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Call Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Call Notes</h3>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">{selectedCall.notes}</p>
                </div>
              </div>

              {/* Placeholder for future content */}
              <div className="text-sm text-muted-foreground italic">
                Additional call details and analysis will be displayed here...
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}