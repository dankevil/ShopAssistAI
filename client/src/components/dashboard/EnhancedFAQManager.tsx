import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { 
  getFAQs, 
  createFAQ, 
  updateFAQ, 
  deleteFAQ, 
  updateFAQSortOrder,
  getFAQCategories,
  createFAQCategory,
  updateFAQCategory,
  deleteFAQCategory
} from '@/lib/api';
import { 
  Pencil, 
  Save, 
  X, 
  Trash2, 
  Plus, 
  MoreVertical, 
  FolderPlus, 
  MoveUp, 
  MoveDown,
  Folder,
  ArrowUpDown,
  Edit,
  CheckCircle,
  MinusCircle
} from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
  categoryId?: number | null;
  sortOrder?: number | null;
}

interface FAQCategory {
  id: number;
  name: string;
  description?: string | null;
  sortOrder?: number | null;
}

interface EnhancedFAQManagerProps {
  storeId: number;
}

export function EnhancedFAQManager({ storeId }: EnhancedFAQManagerProps) {
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState<{ question: string; answer: string; categoryId?: number | string }>({
    question: '',
    answer: '',
    categoryId: undefined
  });
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [newCategory, setNewCategory] = useState<{ name: string; description: string }>({
    name: '',
    description: ''
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError
  } = useQuery({
    queryKey: ['/api/faq-categories', storeId],
    queryFn: () => getFAQCategories(storeId),
    enabled: !!storeId
  });

  // Fetch FAQs
  const { 
    data: faqsData, 
    isLoading: isLoadingFaqs, 
    error: faqsError 
  } = useQuery({
    queryKey: ['/api/faqs', storeId],
    queryFn: () => getFAQs(storeId),
    enabled: !!storeId,
  });

  // Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: (category: { storeId: number; name: string; description?: string }) => 
      createFAQCategory(category.storeId, category.name, category.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faq-categories', storeId] });
      toast({
        title: 'Category created',
        description: 'Your FAQ category has been created successfully.',
      });
      setNewCategory({ name: '', description: '' });
      setCategoryDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error creating the category.',
        variant: 'destructive',
      });
    },
  });

  // Update Category Mutation
  const updateCategoryMutation = useMutation({
    mutationFn: (category: { id: number; data: Partial<FAQCategory> }) => 
      updateFAQCategory(category.id, category.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faq-categories', storeId] });
      toast({
        title: 'Category updated',
        description: 'Your FAQ category has been updated successfully.',
      });
      setEditingCategory(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error updating the category.',
        variant: 'destructive',
      });
    },
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteFAQCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faq-categories', storeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', storeId] });
      toast({
        title: 'Category deleted',
        description: 'Your FAQ category has been deleted successfully.',
      });
      if (selectedCategory !== 'all' && parseInt(selectedCategory) === editingCategory?.id) {
        setSelectedCategory('all');
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error deleting the category.',
        variant: 'destructive',
      });
    },
  });

  // Create FAQ Mutation
  const createFaqMutation = useMutation({
    mutationFn: (faq: { 
      storeId: number; 
      question: string; 
      answer: string; 
      categoryId?: number;
      sortOrder?: number;
    }) => createFAQ(
      faq.storeId, 
      faq.question, 
      faq.answer, 
      faq.categoryId, 
      faq.sortOrder
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', storeId] });
      toast({
        title: 'FAQ created',
        description: 'Your FAQ has been created successfully.',
      });
      setNewFaq({ question: '', answer: '', categoryId: undefined });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error creating the FAQ.',
        variant: 'destructive',
      });
    },
  });

  // Update FAQ Mutation
  const updateFaqMutation = useMutation({
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

  // Update FAQ Sort Order Mutation
  const updateFaqSortOrderMutation = useMutation({
    mutationFn: (params: { id: number; sortOrder: number }) => 
      updateFAQSortOrder(params.id, params.sortOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', storeId] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error reordering the FAQ.',
        variant: 'destructive',
      });
    },
  });

  // Delete FAQ Mutation
  const deleteFaqMutation = useMutation({
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

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const toggleFaqStatus = (faq: FAQ) => {
    updateFaqMutation.mutate({
      id: faq.id,
      data: { isActive: !faq.isActive },
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Category name is required.',
        variant: 'destructive',
      });
      return;
    }

    createCategoryMutation.mutate({
      storeId,
      name: newCategory.name,
      description: newCategory.description || undefined,
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    
    if (!editingCategory.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Category name is required.',
        variant: 'destructive',
      });
      return;
    }

    updateCategoryMutation.mutate({
      id: editingCategory.id,
      data: {
        name: editingCategory.name,
        description: editingCategory.description,
      },
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

    // Calculate sort order for the new FAQ
    let sortOrder = 0;
    if (newFaq.categoryId) {
      const faqsInCategory = faqsData?.faqs.filter(f => f.categoryId === newFaq.categoryId) || [];
      if (faqsInCategory.length > 0) {
        const maxSortOrder = Math.max(...faqsInCategory.map(f => f.sortOrder || 0));
        sortOrder = maxSortOrder + 10; // Add buffer for future insertions
      }
    }

    createFaqMutation.mutate({
      storeId,
      question: newFaq.question,
      answer: newFaq.answer,
      categoryId: typeof newFaq.categoryId === 'string' ? undefined : newFaq.categoryId,
      sortOrder,
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

    updateFaqMutation.mutate({
      id: editingFaq.id,
      data: {
        question: editingFaq.question,
        answer: editingFaq.answer,
        categoryId: editingFaq.categoryId,
      },
    });
  };

  const handleMoveFaqUp = (faq: FAQ) => {
    if (!faq.sortOrder) return;
    
    const categoryFaqs = faqsData?.faqs.filter(f => f.categoryId === faq.categoryId) || [];
    categoryFaqs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    const currentIndex = categoryFaqs.findIndex(f => f.id === faq.id);
    if (currentIndex <= 0) return; // Already at the top
    
    const previousFaq = categoryFaqs[currentIndex - 1];
    const newSortOrder = (previousFaq.sortOrder || 0) - 5;
    
    updateFaqSortOrderMutation.mutate({
      id: faq.id,
      sortOrder: newSortOrder,
    });
  };

  const handleMoveFaqDown = (faq: FAQ) => {
    if (!faq.sortOrder) return;
    
    const categoryFaqs = faqsData?.faqs.filter(f => f.categoryId === faq.categoryId) || [];
    categoryFaqs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    const currentIndex = categoryFaqs.findIndex(f => f.id === faq.id);
    if (currentIndex >= categoryFaqs.length - 1) return; // Already at the bottom
    
    const nextFaq = categoryFaqs[currentIndex + 1];
    const newSortOrder = (nextFaq.sortOrder || 0) + 5;
    
    updateFaqSortOrderMutation.mutate({
      id: faq.id,
      sortOrder: newSortOrder,
    });
  };

  const categories = categoriesData?.categories || [];
  let faqs = faqsData?.faqs || [];

  // Filter FAQs by selected category
  if (selectedCategory !== 'all') {
    const categoryId = parseInt(selectedCategory);
    faqs = faqs.filter((faq) => faq.categoryId === categoryId);
  }

  // Sort FAQs by category then by sort order
  faqs.sort((a, b) => {
    if (a.categoryId !== b.categoryId && a.categoryId && b.categoryId) {
      return a.categoryId - b.categoryId;
    }
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  const isLoading = isLoadingCategories || isLoadingFaqs;
  const hasError = categoriesError || faqsError;

  if (hasError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>FAQ Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading data. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  // Get category name by ID
  const getCategoryName = (categoryId?: number | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-gray-200 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold text-gray-900">FAQ Management</CardTitle>
          <CardDescription>
            Organize and manage your frequently asked questions
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setCategoryDialogOpen(true)}
            className="flex items-center"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6">
          <Tabs defaultValue="all" onValueChange={handleCategoryChange} value={selectedCategory}>
            <div className="flex justify-between items-center mb-4 overflow-x-auto pb-2">
              <TabsList className="flex-nowrap overflow-x-auto">
                <TabsTrigger value="all">All FAQs</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id.toString()} className="flex items-center whitespace-nowrap">
                    <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate max-w-[100px]">{category.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="ml-2 p-0 h-6 w-6 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Category Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the "${category.name}" category? All FAQs in this category will become uncategorized.`)) {
                              deleteCategoryMutation.mutate(category.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg mb-6">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    {selectedCategory === 'all' && <TableHead className="whitespace-nowrap">Category</TableHead>}
                    <TableHead className="whitespace-nowrap">Question</TableHead>
                    <TableHead className="whitespace-nowrap">Answer</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {selectedCategory === 'all' && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : faqs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={selectedCategory === 'all' ? 5 : 4} className="text-center py-8 text-gray-500">
                        No FAQs {selectedCategory !== 'all' ? 'in this category' : ''} yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    faqs.map((faq) => (
                      <TableRow key={faq.id}>
                        {selectedCategory === 'all' && (
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {getCategoryName(faq.categoryId)}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="max-w-[200px] md:max-w-xs truncate">
                          {editingFaq?.id === faq.id ? (
                            <Input
                              value={editingFaq.question}
                              onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                              className="w-full"
                            />
                          ) : (
                            <div className="truncate" title={faq.question}>
                              {faq.question}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] md:max-w-md truncate">
                          {editingFaq?.id === faq.id ? (
                            <Textarea
                              value={editingFaq.answer}
                              onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                              rows={2}
                              className="w-full"
                            />
                          ) : (
                            <div className="truncate" title={faq.answer}>
                              {faq.answer}
                            </div>
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
                              {categories.length > 0 && (
                                <Select
                                  value={editingFaq.categoryId?.toString() || ''}
                                  onValueChange={(value) => setEditingFaq({ 
                                    ...editingFaq, 
                                    categoryId: value === "uncategorized" ? null : (value ? parseInt(value) : null)
                                  })}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                                    {categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
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
                                disabled={updateFaqMutation.isPending}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveFaqUp(faq)}
                                disabled={updateFaqSortOrderMutation.isPending}
                                className="text-gray-600 p-1 h-8 w-8 md:p-2"
                              >
                                <MoveUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveFaqDown(faq)}
                                disabled={updateFaqSortOrderMutation.isPending}
                                className="text-gray-600 p-1 h-8 w-8 md:p-2"
                              >
                                <MoveDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingFaq(faq)}
                                className="hidden md:flex"
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingFaq(faq)}
                                className="md:hidden p-1 h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={faq.isActive ? "ghost" : "outline"}
                                size="sm"
                                onClick={() => toggleFaqStatus(faq)}
                                className={`${faq.isActive ? "text-gray-600" : "text-green-600"} hidden md:inline-flex`}
                              >
                                {faq.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant={faq.isActive ? "ghost" : "outline"}
                                size="sm"
                                onClick={() => toggleFaqStatus(faq)}
                                className={`${faq.isActive ? "text-gray-600" : "text-green-600"} md:hidden p-1 h-8 w-8`}
                              >
                                {faq.isActive ? <MinusCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this FAQ?')) {
                                    deleteFaqMutation.mutate(faq.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-8 w-8 md:p-2"
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
          </Tabs>
        </div>

        <div className="bg-gray-50 p-6 rounded-b-lg border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New FAQ</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newFaq.categoryId?.toString() || ''}
                  onValueChange={(value) => setNewFaq({ 
                    ...newFaq, 
                    categoryId: value === "uncategorized" ? undefined : (value ? parseInt(value) : undefined)
                  })}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                disabled={createFaqMutation.isPending || !newFaq.question.trim() || !newFaq.answer.trim()}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add FAQ
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Category Management Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your FAQs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description (optional)</Label>
              <Textarea
                id="category-description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleAddCategory}
              disabled={createCategoryMutation.isPending || !newCategory.name.trim()}
            >
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog 
        open={!!editingCategory} 
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category-description">Description (optional)</Label>
                <Textarea
                  id="edit-category-description"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleUpdateCategory}
              disabled={updateCategoryMutation.isPending || !editingCategory?.name.trim()}
            >
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}