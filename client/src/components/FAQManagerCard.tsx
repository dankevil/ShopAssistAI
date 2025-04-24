import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { getFaqs, createFaq, updateFaq, deleteFaq } from "@/lib/api";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
}

export default function FAQManagerCard() {
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
    if (confirm("Are you sure you want to delete this FAQ?")) {
      deleteFaqMutation.mutate(id);
    }
  };
  
  const displayedFaqs = faqs?.slice(0, 3) || [];
  const totalFaqs = faqs?.length || 0;
  
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-3">
                <div className="flex justify-between items-start">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex space-x-2">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="mt-2 h-10 bg-gray-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>FAQ Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Add frequently asked questions to help your chatbot provide quick responses before using AI.
          </p>
          <div className="space-y-3">
            {displayedFaqs.map((faq: FAQ) => (
              <div key={faq.id} className="border border-gray-200 rounded-md p-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-gray-900">{faq.question}</h4>
                  <div className="flex space-x-2">
                    <button 
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => handleOpenDialog(faq)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => handleDelete(faq.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {faq.answer}
                </p>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary bg-indigo-50 hover:bg-indigo-100 focus:outline-none"
              onClick={() => handleOpenDialog()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New FAQ
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center">
          <span className="text-sm text-gray-500">{totalFaqs} of 10 recommended FAQs added</span>
          <Link href="/faq-manager">
            <a className="text-sm font-medium text-primary hover:text-secondary">
              See all FAQs
            </a>
          </Link>
        </CardFooter>
      </Card>
      
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
    </>
  );
}
