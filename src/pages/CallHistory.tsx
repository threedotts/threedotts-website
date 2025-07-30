import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Clock, MessageSquare, TrendingUp, CalendarIcon, X } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { cn } from "@/lib/utils";

// Database types
interface CallTranscription {
  id: string;
  date: string;
  time: string;
  duration: number;
  agent: string;
  customer: string;
  evaluation_result: string;
  summary: string | null;
  audio_storage_path: string | null;
  messages: any; // This will be JSONB from the database
  created_at: string;
  updated_at: string;
}

interface TranscriptionMessage {
  speaker: string;
  message: string;
  timestamp: string;
}

const getEvaluationColor = (result: string) => {
  switch (result.toLowerCase()) {
    case "excelente":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "bom":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "regular":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "ruim":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export default function CallHistory() {
  const [selectedCall, setSelectedCall] = useState<CallTranscription | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [calls, setCalls] = useState<CallTranscription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedEvaluation, setSelectedEvaluation] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch calls from database
  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const { data, error } = await supabase
          .from('call_transcriptions')
          .select('*')
          .order('date', { ascending: false })
          .order('time', { ascending: false });

        if (error) {
          toast({
            title: "Erro ao carregar chamadas",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        setCalls(data || []);
      } catch (error) {
        toast({
          title: "Erro ao carregar chamadas",
          description: "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  // Get unique values for dropdowns
  const uniqueEvaluations = Array.from(new Set(calls.map(call => call.evaluation_result)));
  const uniqueAgents = Array.from(new Set(calls.map(call => call.agent)));

  // Filter calls based on selected filters
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      const callDate = new Date(call.date);
      
      // Date filters
      if (startDate && callDate < startDate) return false;
      if (endDate && callDate > endDate) return false;
      
      // Evaluation filter
      if (selectedEvaluation && call.evaluation_result !== selectedEvaluation) return false;
      
      // Agent filter
      if (selectedAgent && call.agent !== selectedAgent) return false;
      
      return true;
    });
  }, [calls, startDate, endDate, selectedEvaluation, selectedAgent]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageCalls = filteredCalls.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filteredCalls.length]);

  // Clear individual filters
  const clearStartDate = () => setStartDate(undefined);
  const clearEndDate = () => setEndDate(undefined);
  const clearEvaluation = () => setSelectedEvaluation("");
  const clearAgent = () => setSelectedAgent("");

  // Check if any filters are active
  const hasActiveFilters = startDate || endDate || selectedEvaluation || selectedAgent;

  const handleCallClick = (call: CallTranscription) => {
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
        <h1 className="text-2xl font-bold text-foreground mb-4">Histórico</h1>
        
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Start Date Filter */}
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 justify-start text-left font-normal pr-8",
                    startDate && "bg-primary/10 border-primary"
                  )}
                >
                  {startDate ? format(startDate, "dd/MM/yyyy") : "+ Data Inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {startDate && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted hover:text-foreground"
                onClick={clearStartDate}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* End Date Filter */}
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 justify-start text-left font-normal pr-8",
                    endDate && "bg-primary/10 border-primary"
                  )}
                >
                  {endDate ? format(endDate, "dd/MM/yyyy") : "+ Data Final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {endDate && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted hover:text-foreground"
                onClick={clearEndDate}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Evaluation Filter */}
          <div className="relative">
            <Select value={selectedEvaluation} onValueChange={setSelectedEvaluation}>
              <SelectTrigger className={cn(
                "h-9 w-auto min-w-[140px] pr-2 justify-between",
                selectedEvaluation && "bg-primary/10 border-primary pr-8",
                selectedEvaluation && "[&>svg]:hidden"
              )}>
                <SelectValue placeholder="+ Avaliação" />
              </SelectTrigger>
              <SelectContent>
                {uniqueEvaluations.map(evaluation => (
                  <SelectItem key={evaluation} value={evaluation}>
                    {evaluation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEvaluation && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted hover:text-foreground"
                onClick={clearEvaluation}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Agent Filter */}
          <div className="relative">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className={cn(
                "h-9 w-auto min-w-[140px] pr-2 justify-between",
                selectedAgent && "bg-primary/10 border-primary pr-8",
                selectedAgent && "[&>svg]:hidden"
              )}>
                <SelectValue placeholder="+ Agente" />
              </SelectTrigger>
              <SelectContent>
                {uniqueAgents.map(agent => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAgent && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted hover:text-foreground"
                onClick={clearAgent}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Show results count and clear all filters */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {loading ? "Carregando..." : `${filteredCalls.length} de ${calls.length} chamadas`}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearStartDate();
                clearEndDate();
                clearEvaluation();
                clearAgent();
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Mensagens</TableHead>
                <TableHead>Resultado da Avaliação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageCalls.map((call) => (
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
                  <TableCell>{call.duration}s</TableCell>
                  <TableCell>{call.messages && Array.isArray(call.messages) ? call.messages.length : 0}</TableCell>
                  <TableCell>
                    <Badge className={cn(getEvaluationColor(call.evaluation_result), "hover:none")}>
                      {call.evaluation_result}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.max(1, currentPage - 1));
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Call Details Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="!w-[1000px] !max-w-[90vw] p-0">
          <div className="flex h-full">
            {/* Left side - New content */}
            <div className="flex-1 flex flex-col border-r">
              <div className="p-6 border-b">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Conversa com {selectedCall?.agent}
                </h3>
                
                {/* Audio Player */}
                <div className="mb-6">
                  {selectedCall?.audio_storage_path ? (
                    <AudioPlayer audioUrl={selectedCall.audio_storage_path} />
                  ) : (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Gravação não disponível</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                <div className="px-6 pt-4 flex-shrink-0">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Resumo</TabsTrigger>
                    <TabsTrigger value="transcription">Transcrição</TabsTrigger>
                    <TabsTrigger value="client-data">Dados do Cliente</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex-1 min-h-0">
                  <TabsContent value="overview" className="h-full m-0">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        {selectedCall && (
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Resumo da Chamada</h4>
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <p className="text-sm">{selectedCall.summary || "Resumo não disponível"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="transcription" className="h-full m-0">
                    <div className="h-full flex flex-col">
                      <div className="p-6 pb-4 flex-shrink-0">
                        <h4 className="text-sm font-medium text-muted-foreground">Transcrição da Chamada</h4>
                      </div>
                      <ScrollArea className="flex-1 px-6">
                        <div className="space-y-4 pb-6">
                          {selectedCall?.messages && Array.isArray(selectedCall.messages) && selectedCall.messages.length > 0 ? (
                             selectedCall.messages.map((message, index) => {
                               const isAgent = message.role === 'agent';
                               const isUser = message.role === 'user';
                               
                               // If message is null, check for tool calls
                               if (!message.message) {
                                 // Check if there are tool calls
                                 if (message.tool_calls && message.tool_calls.length > 0) {
                                   // Show tool call in the middle
                                   return (
                                     <div key={index} className="flex justify-center my-4">
                                       <div className="text-center text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg border border-border/50">
                                         <p className="font-medium">{message.tool_calls[0].tool_name}</p>
                                       </div>
                                     </div>
                                   );
                                 } else {
                                   // If both message and tool calls are null, don't show anything
                                   return null;
                                 }
                               }
                               
                               return (
                                 <div key={index} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                                   <div className="flex flex-col max-w-[75%]">
                                     {/* Speaker name */}
                                     <p className={`text-xs font-medium mb-1 ${
                                       isAgent ? 'text-left text-muted-foreground' : 'text-right text-foreground'
                                     }`}>
                                       {isAgent ? `Agente • ${selectedCall.agent}` : `Cliente • ${selectedCall.customer}`}
                                     </p>
                                     
                                     {/* Message bubble */}
                                     <div className={`p-3 rounded-lg ${
                                       isAgent 
                                         ? 'bg-muted border border-border rounded-tl-none' 
                                         : 'bg-accent text-accent-foreground rounded-tr-none border border-accent/20'
                                     }`}>
                                       <p className="text-sm leading-relaxed">{message.message}</p>
                                       {message.timestamp && (
                                         <p className={`text-xs mt-2 ${
                                           isAgent ? 'text-muted-foreground' : 'text-primary-foreground/70'
                                         }`}>
                                           {message.timestamp}
                                         </p>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                                );
                              }).filter(Boolean)
                         ) : (
                          <div className="text-center text-muted-foreground py-8">
                            <p>Nenhuma transcrição disponível para esta chamada</p>
                          </div>
                        )}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="client-data" className="h-full m-0">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-muted-foreground">Informações do Cliente</h4>
                          <div className="space-y-3">
                            {selectedCall && (
                              <>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Nome do Cliente</p>
                                  <p className="text-sm">{selectedCall.customer}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Data da Chamada</p>
                                  <p className="text-sm">{selectedCall.date}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Horário</p>
                                  <p className="text-sm">{selectedCall.time}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            {/* Right side - Original content */}
            <div className="w-80 flex flex-col">
              <SheetHeader className="p-6 border-b">
                <SheetTitle>Detalhes da Chamada</SheetTitle>
              </SheetHeader>
              <div className="flex-1 p-6 overflow-auto">
                {selectedCall && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Cliente</p>
                          <p className="text-sm text-muted-foreground">{selectedCall.customer}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Duração</p>
                          <p className="text-sm text-muted-foreground">{selectedCall.duration}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Mensagens</p>
                          <p className="text-sm text-muted-foreground">{selectedCall?.messages && Array.isArray(selectedCall.messages) ? selectedCall.messages.length : 0} mensagens</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Avaliação</p>
                          <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", getEvaluationColor(selectedCall.evaluation_result))}>
                            {selectedCall.evaluation_result}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Informações do Contato</h4>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <p className="text-sm"><strong>Nome:</strong> {selectedCall.customer}</p>
                        <p className="text-sm"><strong>Data:</strong> {selectedCall.date}</p>
                        <p className="text-sm"><strong>Horário:</strong> {selectedCall.time}</p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}