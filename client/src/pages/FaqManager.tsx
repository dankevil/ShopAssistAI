import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getFaqs, createFaq, updateFaq, deleteFaq } from "@/lib/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FAQManagerCard from "@/components/FAQManagerCard";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
}

export default function FaqManager() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['/api/faqs'],
    queryFn: getFaqs
  });
  
  const createFaqMutation = useMutation({
    mutationFn: ({ question, answer }: { question: string; answer: string }) => 
      createFaq(question, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      resetForm();
      setDialogOpen(false);
      toast({
        title: "FAQ Added",
        description: "Your FAQ has been successfully added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add FAQ",
        variant: "destructive",
      });
    }
  });
  
  const updateFaqMutation = useMutation({
    mutationFn: ({ id, question, answer }: { id: number; question: string; answer: string }) => 
      updateFaq(id, question, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      resetForm();
      setDialogOpen(false);
      toast({
        title: "FAQ Updated",
        description: "Your FAQ has been successfully updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update FAQ",
        variant: "destructive",
      });
    }
  });
  
  const deleteFaqMutation = useMutation({
    mutationFn: (id: number) => deleteFaq(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      toast({
        title: "FAQ Deleted",
        description: "Your FAQ has been successfully deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setEditingFaq(null);
  };
  
  const handleOpenDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setQuestion(faq.question);
      setAnswer(faq.answer);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || !answer.trim()) {
      toast({
        title: "Validation Error",
        description: "Both question and answer are required",
        variant: "destructive",
      });
      return;
    }
    
    if (editingFaq) {
      updateFaqMutation.mutate({
        id: editingFaq.id,
        question,
        answer
      });
    } else {
      createFaqMutation.mutate({ question, answer });
    }
  };
  
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this FAQ? This action cannot be undone.")) {
      deleteFaqMutation.mutate(id);
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">FAQ Manager</h1>
          <Button onClick={() => handleOpenDialog()}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New FAQ
          </Button>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-100 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : faqs?.length === 0 ? (
              <div className="p-10 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">No FAQs added yet</p>
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  Add Your First FAQ
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {faqs?.map((faq: FAQ) => (
                  <div key={faq.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-900">{faq.question}</h4>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-gray-500 hover:text-gray-700"
                          onClick={() => handleOpenDialog(faq)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 px-2 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(faq.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </div>
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>FAQ Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <p className="text-sm text-gray-600">
                    Adding FAQs helps your chatbot provide quick answers to common questions without using AI, which can improve response speed and accuracy.
                  </p>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <h4 className="font-medium">Tips for effective FAQs:</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                  <li>Keep questions concise and to the point</li>
                  <li>Answer the most common customer questions first</li>
                  <li>Use natural language that matches how customers actually ask questions</li>
                  <li>Group related questions together</li>
                  <li>Consider adding FAQs about shipping, returns, sizing, and product care</li>
                  <li>Update your FAQs regularly based on customer interactions</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Suggested FAQ categories:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-md p-3">
                    <h5 className="font-medium text-sm">Orders & Shipping</h5>
                    <p className="text-xs text-gray-500 mt-1">Delivery times, tracking, shipping costs</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h5 className="font-medium text-sm">Returns & Refunds</h5>
                    <p className="text-xs text-gray-500 mt-1">Return policy, process, timeframes</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h5 className="font-medium text-sm">Product Information</h5>
                    <p className="text-xs text-gray-500 mt-1">Sizing, materials, care instructions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
              <DialogDescription>
                {editingFaq 
                  ? "Update your frequently asked question and answer" 
                  : "Add a new question and answer to help your customers"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    placeholder="e.g., What are your shipping options?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea
                    id="answer"
                    placeholder="Provide a detailed answer..."
                    rows={5}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createFaqMutation.isPending || updateFaqMutation.isPending}
                >
                  {createFaqMutation.isPending || updateFaqMutation.isPending
                    ? "Saving..."
                    : editingFaq ? "Update FAQ" : "Add FAQ"
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
