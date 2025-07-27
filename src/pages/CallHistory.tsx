import { useState, useMemo } from "react";
import { format } from "date-fns";
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
import { Phone, Clock, MessageSquare, TrendingUp, CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data - will be replaced with real data from database later
const mockCalls = [
  {
    id: "1",
    date: "2024-01-26",
    time: "14:30",
    agent: "Maria Silva",
    duration: "5m 23s",
    messageCount: 12,
    evaluationResult: "Excelente",
    customer: "João Santos",
    phone: "+55 11 98765-4321",
    purpose: "Consulta sobre produto",
    notes: "Cliente interessado no pacote premium. Solicitou ligação de acompanhamento.",
  },
  {
    id: "2",
    date: "2024-01-26",
    time: "13:15",
    agent: "Carlos Oliveira",
    duration: "8m 45s",
    messageCount: 18,
    evaluationResult: "Bom",
    customer: "Ana Costa",
    phone: "+55 21 99876-5432",
    purpose: "Solicitação de suporte",
    notes: "Problema técnico resolvido. Cliente satisfeito com a solução.",
  },
  {
    id: "3",
    date: "2024-01-26",
    time: "11:20",
    agent: "Fernanda Lima",
    duration: "3m 12s",
    messageCount: 8,
    evaluationResult: "Regular",
    customer: "Pedro Almeida",
    phone: "+55 31 97654-3210",
    purpose: "Dúvida sobre cobrança",
    notes: "Esclarecimento sobre cobrança fornecido. Cliente precisa entrar em contato com financeiro.",
  },
  {
    id: "4",
    date: "2024-01-25",
    time: "16:45",
    agent: "Roberto Santos",
    duration: "12m 18s",
    messageCount: 25,
    evaluationResult: "Excelente",
    customer: "Luciana Ferreira",
    phone: "+55 11 96543-2109",
    purpose: "Novo contrato",
    notes: "Novo contrato negociado com sucesso. Cliente assinou plano anual.",
  },
  {
    id: "5",
    date: "2024-01-25",
    time: "15:30",
    agent: "Juliana Rocha",
    duration: "6m 55s",
    messageCount: 14,
    evaluationResult: "Ruim",
    customer: "Marcos Souza",
    phone: "+55 85 95432-1098",
    purpose: "Reclamação",
    notes: "Reclamação do cliente sobre atraso no serviço. Escalado para supervisor.",
  },
  {
    id: "6",
    date: "2024-01-25",
    time: "14:15",
    agent: "Maria Silva",
    duration: "4m 30s",
    messageCount: 10,
    evaluationResult: "Bom",
    customer: "Sandra Pereira",
    phone: "+55 47 94321-0987",
    purpose: "Informações sobre upgrade",
    notes: "Cliente interessada em upgrade do plano. Agendou nova conversa.",
  },
  {
    id: "7",
    date: "2024-01-25",
    time: "12:45",
    agent: "Carlos Oliveira",
    duration: "7m 22s",
    messageCount: 16,
    evaluationResult: "Excelente",
    customer: "Rafael Mendes",
    phone: "+55 19 93210-9876",
    purpose: "Suporte técnico",
    notes: "Problema de conectividade resolvido. Cliente muito satisfeito.",
  },
  {
    id: "8",
    date: "2024-01-24",
    time: "17:20",
    agent: "Fernanda Lima",
    duration: "9m 15s",
    messageCount: 20,
    evaluationResult: "Bom",
    customer: "Amanda Torres",
    phone: "+55 27 92109-8765",
    purpose: "Cancelamento",
    notes: "Cliente cancelou serviço. Motivo: mudança para outro estado.",
  },
  {
    id: "9",
    date: "2024-01-24",
    time: "16:10",
    agent: "Roberto Santos",
    duration: "2m 45s",
    messageCount: 6,
    evaluationResult: "Regular",
    customer: "Bruno Cardoso",
    phone: "+55 62 91098-7654",
    purpose: "Consulta rápida",
    notes: "Consulta sobre horário de funcionamento. Informação fornecida.",
  },
  {
    id: "10",
    date: "2024-01-24",
    time: "15:35",
    agent: "Juliana Rocha",
    duration: "11m 30s",
    messageCount: 22,
    evaluationResult: "Excelente",
    customer: "Patrícia Dias",
    phone: "+55 51 90987-6543",
    purpose: "Renovação",
    notes: "Contrato renovado com desconto especial. Cliente fidelizada.",
  },
  {
    id: "11",
    date: "2024-01-24",
    time: "14:20",
    agent: "Maria Silva",
    duration: "6m 12s",
    messageCount: 13,
    evaluationResult: "Bom",
    customer: "Gustavo Reis",
    phone: "+55 71 89876-5432",
    purpose: "Dúvida técnica",
    notes: "Dúvida sobre configuração esclarecida. Cliente conseguiu resolver.",
  },
  {
    id: "12",
    date: "2024-01-23",
    time: "18:45",
    agent: "Carlos Oliveira",
    duration: "5m 50s",
    messageCount: 11,
    evaluationResult: "Regular",
    customer: "Camila Barbosa",
    phone: "+55 41 88765-4321",
    purpose: "Reclamação",
    notes: "Reclamação sobre atendimento anterior. Situação esclarecida.",
  },
  {
    id: "13",
    date: "2024-01-23",
    time: "17:30",
    agent: "Fernanda Lima",
    duration: "8m 20s",
    messageCount: 17,
    evaluationResult: "Excelente",
    customer: "Diego Martins",
    phone: "+55 84 87654-3210",
    purpose: "Upgrade de plano",
    notes: "Upgrade realizado com sucesso. Cliente satisfeito com novas funcionalidades.",
  },
  {
    id: "14",
    date: "2024-01-23",
    time: "16:15",
    agent: "Roberto Santos",
    duration: "4m 35s",
    messageCount: 9,
    evaluationResult: "Bom",
    customer: "Renata Gomes",
    phone: "+55 67 86543-2109",
    purpose: "Informações gerais",
    notes: "Informações sobre serviços fornecidas. Cliente demonstrou interesse.",
  },
  {
    id: "15",
    date: "2024-01-23",
    time: "15:05",
    agent: "Juliana Rocha",
    duration: "10m 25s",
    messageCount: 21,
    evaluationResult: "Ruim",
    customer: "Thiago Nunes",
    phone: "+55 79 85432-1098",
    purpose: "Problema técnico",
    notes: "Problema não resolvido na primeira tentativa. Ticket criado para equipe técnica.",
  },
  {
    id: "16",
    date: "2024-01-22",
    time: "17:40",
    agent: "Maria Silva",
    duration: "7m 08s",
    messageCount: 15,
    evaluationResult: "Excelente",
    customer: "Vanessa Lima",
    phone: "+55 63 84321-0987",
    purpose: "Contratação",
    notes: "Nova contratação finalizada. Cliente muito satisfeita com proposta.",
  },
  {
    id: "17",
    date: "2024-01-22",
    time: "16:25",
    agent: "Carlos Oliveira",
    duration: "3m 42s",
    messageCount: 7,
    evaluationResult: "Bom",
    customer: "Leandro Costa",
    phone: "+55 69 83210-9876",
    purpose: "Consulta sobre fatura",
    notes: "Dúvida sobre fatura esclarecida. Cliente satisfeito.",
  },
  {
    id: "18",
    date: "2024-01-22",
    time: "15:10",
    agent: "Fernanda Lima",
    duration: "9m 30s",
    messageCount: 19,
    evaluationResult: "Regular",
    customer: "Cristina Santos",
    phone: "+55 68 82109-8765",
    purpose: "Mudança de endereço",
    notes: "Mudança de endereço registrada. Aguardando confirmação técnica.",
  },
  {
    id: "19",
    date: "2024-01-22",
    time: "14:55",
    agent: "Roberto Santos",
    duration: "6m 18s",
    messageCount: 12,
    evaluationResult: "Bom",
    customer: "Henrique Moura",
    phone: "+55 82 81098-7654",
    purpose: "Suporte",
    notes: "Suporte prestado com sucesso. Cliente conseguiu resolver a questão.",
  },
  {
    id: "20",
    date: "2024-01-21",
    time: "18:20",
    agent: "Juliana Rocha",
    duration: "13m 45s",
    messageCount: 28,
    evaluationResult: "Excelente",
    customer: "Isabela Ferraz",
    phone: "+55 86 80987-6543",
    purpose: "Negociação",
    notes: "Negociação de desconto bem-sucedida. Cliente manteve o serviço.",
  },
];

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
  const [selectedCall, setSelectedCall] = useState<typeof mockCalls[0] | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Filter states
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedEvaluation, setSelectedEvaluation] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique values for dropdowns
  const uniqueEvaluations = Array.from(new Set(mockCalls.map(call => call.evaluationResult)));
  const uniqueAgents = Array.from(new Set(mockCalls.map(call => call.agent)));

  // Filter calls based on selected filters
  const filteredCalls = useMemo(() => {
    return mockCalls.filter(call => {
      const callDate = new Date(call.date);
      
      // Date filters
      if (startDate && callDate < startDate) return false;
      if (endDate && callDate > endDate) return false;
      
      // Evaluation filter
      if (selectedEvaluation && call.evaluationResult !== selectedEvaluation) return false;
      
      // Agent filter
      if (selectedAgent && call.agent !== selectedAgent) return false;
      
      return true;
    });
  }, [startDate, endDate, selectedEvaluation, selectedAgent]);

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
            {filteredCalls.length} de {mockCalls.length} chamadas
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
                  <TableCell>{call.duration}</TableCell>
                  <TableCell>{call.messageCount}</TableCell>
                  <TableCell>
                    <Badge className={getEvaluationColor(call.evaluationResult)}>
                      {call.evaluationResult}
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
        <SheetContent className="w-[800px] sm:w-[900px] p-0">
          <div className="flex h-full">
            {/* Left side - New content */}
            <div className="w-80 flex flex-col border-r">
              <div className="p-6 border-b">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Conversation with {selectedCall?.agent}
                </h3>
                
                {/* Audio Player */}
                <div className="mb-6">
                  <audio
                    controls
                    className="w-full"
                    preload="metadata"
                  >
                    <source src="#" type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                <div className="px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="transcription">Transcription</TabsTrigger>
                    <TabsTrigger value="client-data">Client Data</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex-1 overflow-auto">
                  <TabsContent value="overview" className="p-6 mt-0">
                    {selectedCall && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Date</p>
                            <p className="text-base">{selectedCall.date}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Time</p>
                            <p className="text-base">{selectedCall.time}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Duration</p>
                            <p className="text-base">{selectedCall.duration}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Messages</p>
                            <p className="text-base">{selectedCall.messageCount}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Customer</p>
                            <p className="text-base">{selectedCall.customer}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Evaluation</p>
                            <Badge className={getEvaluationColor(selectedCall.evaluationResult)}>
                              {selectedCall.evaluationResult}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Call Summary</h4>
                          <p className="text-sm">{selectedCall.notes}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="transcription" className="p-6 mt-0">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Call Transcription</h4>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm">Transcription content will be displayed here...</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="client-data" className="p-6 mt-0">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Client Information</h4>
                      <div className="space-y-3">
                        {selectedCall && (
                          <>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                              <p className="text-sm">{selectedCall.customer}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Phone</p>
                              <p className="text-sm">{selectedCall.phone}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                              <p className="text-sm">{selectedCall.purpose}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            {/* Right side - Original content */}
            <div className="flex-1 flex flex-col">
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
                          <p className="text-sm text-muted-foreground">{selectedCall.messageCount} mensagens</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Avaliação</p>
                          <Badge className={getEvaluationColor(selectedCall.evaluationResult)}>
                            {selectedCall.evaluationResult}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Informações do Contato</h4>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <p className="text-sm"><strong>Nome:</strong> {selectedCall.customer}</p>
                        <p className="text-sm"><strong>Telefone:</strong> {selectedCall.phone}</p>
                        <p className="text-sm"><strong>Propósito:</strong> {selectedCall.purpose}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Observações</h4>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm">{selectedCall.notes}</p>
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