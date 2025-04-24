import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from '@/lib/api';
import { Pencil, Save, X, Trash2, Plus } from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
}

interface FAQManagerProps {
  storeId: number;
}

export function FAQManager({ storeId }: FAQManagerProps) {
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState<{ question: string; answer: string }>({
    question: '',
    answer: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/faqs', storeId],
    queryFn: () => getFAQs(storeId),
    enabled: !!storeId,
  });

  const createMutation = useMutation({
    mutationFn: (faq: { storeId: number; question: string; answer: string }) => 
      createFAQ(faq.storeId, faq.question, faq.answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', storeId] });
      toast({
        title: 'FAQ created',
        description: 'Your FAQ has been created successfully.',
      });
      setNewFaq({ question: '', answer: '' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error creating the FAQ.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (faq: { id: number; data: Partial<FAQ> }) => 
      updateFAQ(faq.id, faq.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', storeId] });
      toast({
        title: 'FAQ updated',
        description: 'Your FAQ has been updated successfully.',
      });
      setEditingFaq(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error updating the FAQ.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFAQ(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', storeId] });
      toast({
        title: 'FAQ deleted',
        description: 'Your FAQ has been deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error deleting the FAQ.',
        variant: 'destructive',
      });
    },
  });

  const toggleFaqStatus = (faq: FAQ) => {
    updateMutation.mutate({
      id: faq.id,
      data: { isActive: !faq.isActive },
    });
  };

  const handleAddFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast({
        title: 'Validation error',
        description: 'Both question and answer are required.',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      storeId,
      question: newFaq.question,
      answer: newFaq.answer,
    });
  };

  const handleUpdateFaq = () => {
    if (!editingFaq) return;
    
    if (!editingFaq.question.trim() || !editingFaq.answer.trim()) {
      toast({
        title: 'Validation error',
        description: 'Both question and answer are required.',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate({
      id: editingFaq.id,
      data: {
        question: editingFaq.question,
        answer: editingFaq.answer,
      },
    });
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>FAQ Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading FAQs. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const faqs = data?.faqs || [];

  return (
    <Card>
      <CardHeader className="px-4 py-5 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">FAQ Management</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-6">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Answer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No FAQs added yet
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="max-w-xs truncate">
                      {editingFaq?.id === faq.id ? (
                        <Input
                          value={editingFaq.question}
                          onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        faq.question
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {editingFaq?.id === faq.id ? (
                        <Textarea
                          value={editingFaq.answer}
                          onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                          rows={2}
                          className="w-full"
                        />
                      ) : (
                        faq.answer
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={faq.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {editingFaq?.id === faq.id ? (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFaq(null)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleUpdateFaq}
                            disabled={updateMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFaq(faq)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant={faq.isActive ? "ghost" : "outline"}
                            size="sm"
                            onClick={() => toggleFaqStatus(faq)}
                            className={faq.isActive ? "text-gray-600" : "text-green-600"}
                          >
                            {faq.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this FAQ?')) {
                                deleteMutation.mutate(faq.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New FAQ</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                className="mt-1"
                placeholder="Enter frequently asked question"
              />
            </div>
            <div>
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                rows={3}
                className="mt-1"
                placeholder="Enter answer to the question"
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleAddFaq} 
                disabled={createMutation.isPending || !newFaq.question.trim() || !newFaq.answer.trim()}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add FAQ
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
