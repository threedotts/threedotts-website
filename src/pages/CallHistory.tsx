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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            + Data Inicial
          </Button>
          <Button variant="outline" size="sm">
            + Data Final
          </Button>
          <Button variant="outline" size="sm">
            + Avaliação
          </Button>
          <Button variant="outline" size="sm">
            + Agente
          </Button>
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

      {/* Call Details Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Detalhes da Chamada</SheetTitle>
          </SheetHeader>
          
          {selectedCall && (
            <div className="mt-6 space-y-6">
              {/* Call Overview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resumo da Chamada</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data</label>
                    <p className="text-sm">{selectedCall.date}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Hora</label>
                    <p className="text-sm">{selectedCall.time}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duração</label>
                    <p className="text-sm flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedCall.duration}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mensagens</label>
                    <p className="text-sm flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {selectedCall.messageCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações do Cliente</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p className="text-sm">{selectedCall.customer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p className="text-sm">{selectedCall.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Motivo</label>
                    <p className="text-sm">{selectedCall.purpose}</p>
                  </div>
                </div>
              </div>

              {/* Agent & Evaluation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Agente e Avaliação</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Agente</label>
                    <p className="text-sm">{selectedCall.agent}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Resultado da Avaliação</label>
                    <Badge className={getEvaluationColor(selectedCall.evaluationResult)}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {selectedCall.evaluationResult}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Call Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Observações da Chamada</h3>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">{selectedCall.notes}</p>
                </div>
              </div>

              {/* Placeholder for future content */}
              <div className="text-sm text-muted-foreground italic">
                Detalhes adicionais da chamada e análise serão exibidos aqui...
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}