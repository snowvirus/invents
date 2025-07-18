import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Building2, 
  Plus, 
  MapPin, 
  Users, 
  Edit, 
  Trash2,
  UserPlus,
  Search
} from "lucide-react";

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  location: z.string().min(1, "Location is required"),
});

export default function Branches() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showAssignAdmin, setShowAssignAdmin] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (!isLoading && user?.role !== 'superadmin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      return;
    }
  }, [user, isLoading, toast]);

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["/api/branches"],
    enabled: user?.role === 'superadmin',
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: user?.role === 'superadmin',
    queryFn: async () => {
      // This endpoint would need to be implemented in the backend
      const response = await fetch('/api/users', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const branchForm = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      location: "",
    },
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof branchSchema>) => {
      await apiRequest('POST', '/api/branches', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Branch created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setShowAddBranch(false);
      branchForm.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create branch",
        variant: "destructive",
      });
    },
  });

  const assignAdminMutation = useMutation({
    mutationFn: async ({ userId, branchId, role }: { userId: string; branchId: number; role: string }) => {
      await apiRequest('PATCH', `/api/users/${userId}`, { 
        role, 
        branchId: role === 'admin' ? branchId : null 
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowAssignAdmin(false);
      setSelectedBranch(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to assign admin",
        variant: "destructive",
      });
    },
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getBranchAdmins = (branchId: number) => {
    return users?.filter((u: any) => u.role === 'admin' && u.branchId === branchId) || [];
  };

  const getAvailableUsers = () => {
    return users?.filter((u: any) => u.role === 'customer') || [];
  };

  const onSubmitBranch = (data: z.infer<typeof branchSchema>) => {
    createBranchMutation.mutate(data);
  };

  const handleAssignAdmin = (userId: string) => {
    if (!selectedBranch) return;
    assignAdminMutation.mutate({
      userId,
      branchId: selectedBranch.id,
      role: 'admin'
    });
  };

  const handleRemoveAdmin = (userId: string) => {
    if (confirm('Are you sure you want to remove this admin? They will become a customer.')) {
      assignAdminMutation.mutate({
        userId,
        branchId: 0,
        role: 'customer'
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6 text-center">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-500">You don't have permission to manage branches.</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Branch Management</h1>
                  <p className="text-sm text-gray-500">Manage business branches and assign administrators</p>
                </div>
                <Dialog open={showAddBranch} onOpenChange={setShowAddBranch}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Branch
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Branch</DialogTitle>
                    </DialogHeader>
                    <Form {...branchForm}>
                      <form onSubmit={branchForm.handleSubmit(onSubmitBranch)} className="space-y-4">
                        <FormField
                          control={branchForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Branch Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Kampala Branch" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={branchForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Kampala, Uganda" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setShowAddBranch(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createBranchMutation.isPending}>
                            {createBranchMutation.isPending ? "Creating..." : "Create Branch"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="branches" className="space-y-6">
              <TabsList>
                <TabsTrigger value="branches">Branches</TabsTrigger>
                <TabsTrigger value="admins">All Admins</TabsTrigger>
              </TabsList>

              <TabsContent value="branches" className="space-y-6">
                {branchesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : branches && branches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map((branch: any) => (
                      <Card key={branch.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{branch.name}</CardTitle>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {branch.location}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Administrators</span>
                              <Badge variant="outline">
                                {getBranchAdmins(branch.id).length} assigned
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              {getBranchAdmins(branch.id).slice(0, 2).map((admin: any) => (
                                <div key={admin.id} className="flex items-center space-x-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={admin.profileImageUrl} />
                                    <AvatarFallback className="bg-gray-400 text-white text-xs">
                                      {getInitials(admin.firstName, admin.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{admin.firstName} {admin.lastName}</span>
                                </div>
                              ))}
                              {getBranchAdmins(branch.id).length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{getBranchAdmins(branch.id).length - 2} more
                                </div>
                              )}
                            </div>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                setSelectedBranch(branch);
                                setShowAssignAdmin(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Assign Admin
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No branches yet</h3>
                      <p className="text-gray-500 mb-4">Create your first branch to get started</p>
                      <Button onClick={() => setShowAddBranch(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Branch
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="admins" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Administrators</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search administrators..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {usersLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="animate-pulse flex space-x-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {users?.filter((u: any) => u.role === 'admin').map((admin: any) => {
                          const branch = branches?.find((b: any) => b.id === admin.branchId);
                          return (
                            <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={admin.profileImageUrl} />
                                  <AvatarFallback className="bg-primary text-white">
                                    {getInitials(admin.firstName, admin.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">{admin.firstName} {admin.lastName}</h4>
                                  <p className="text-sm text-gray-500">{admin.email}</p>
                                  {branch && (
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                      <Building2 className="h-3 w-3 mr-1" />
                                      {branch.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge>Admin</Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAdmin(admin.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Assign Admin Modal */}
      <Dialog open={showAssignAdmin} onOpenChange={setShowAssignAdmin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign Admin to {selectedBranch?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {getAvailableUsers().map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl} />
                      <AvatarFallback className="bg-gray-400 text-white text-sm">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssignAdmin(user.id)}
                    disabled={assignAdminMutation.isPending}
                  >
                    Assign
                  </Button>
                </div>
              ))}
              {getAvailableUsers().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No available users to assign as admin</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowAssignAdmin(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
