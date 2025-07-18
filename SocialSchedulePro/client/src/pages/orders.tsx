import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  Eye, 
  Check, 
  X, 
  Clock, 
  Search,
  Filter,
  MessageSquare,
  Package,
  MapPin,
  Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Orders() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (typeFilter) params.append('type', typeFilter);
    return params.toString();
  };

  const { data: orders, isLoading: ordersLoading, error } = useQuery({
    queryKey: ["/api/orders", buildQueryParams()],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await fetch(`/api/orders${params ? `?${params}` : ''}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'custom':
        return 'bg-blue-100 text-blue-800';
      case 'inquiry':
        return 'bg-purple-100 text-purple-800';
      case 'standard':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formatPrice = (price: string | number) => {
    return `UGX ${parseFloat(price.toString()).toLocaleString()}`;
  };

  const filteredOrders = orders?.filter((order: any) => {
    if (!searchQuery) return true;
    const customer = `${order.user?.firstName} ${order.user?.lastName}`.toLowerCase();
    const description = order.description?.toLowerCase() || '';
    const location = order.location?.toLowerCase() || '';
    return customer.includes(searchQuery.toLowerCase()) || 
           description.includes(searchQuery.toLowerCase()) ||
           location.includes(searchQuery.toLowerCase());
  });

  const isAdminOrSuperAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {user?.role === 'customer' ? 'My Orders' : 'Orders & Inquiries'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {user?.role === 'customer' 
                      ? 'Track your orders and inquiries' 
                      : 'Manage customer orders and respond to inquiries'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search orders by customer, description, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="standard">Standard Order</SelectItem>
                        <SelectItem value="custom">Custom Order</SelectItem>
                        <SelectItem value="inquiry">Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-red-500 mb-4">Failed to load orders</div>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </CardContent>
              </Card>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order: any) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={order.user?.profileImageUrl} />
                          <AvatarFallback className="bg-gray-400 text-white">
                            {getInitials(order.user?.firstName, order.user?.lastName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900">
                                  {order.user?.firstName} {order.user?.lastName}
                                </h3>
                                <Badge className={getTypeColor(order.type)}>
                                  {order.type}
                                </Badge>
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">{order.user?.email}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-sm text-gray-500 mb-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                              </div>
                              {order.totalPrice && (
                                <div className="font-semibold text-gray-900 currency">
                                  {formatPrice(order.totalPrice)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {order.product && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{order.product.name}</span>
                                <span className="text-gray-500">• {order.product.business}</span>
                              </div>
                            )}
                            
                            <p className="text-sm text-gray-700">
                              {order.description}
                            </p>

                            {order.location && (
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <MapPin className="h-4 w-4" />
                                <span>{order.location}</span>
                              </div>
                            )}

                            {order.imageUrl && (
                              <div className="mt-2">
                                <img 
                                  src={order.imageUrl} 
                                  alt="Order attachment"
                                  className="w-32 h-32 object-cover rounded-lg border"
                                />
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {order.type === 'inquiry' ? 'Respond' : 'Message'}
                              </Button>
                            </div>
                            
                            {/* Admin Actions */}
                            {isAdminOrSuperAdmin && order.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleStatusUpdate(order.id, 'approved')}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleStatusUpdate(order.id, 'rejected')}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {isAdminOrSuperAdmin && order.status === 'approved' && (
                              <Button 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                disabled={updateOrderStatusMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || statusFilter || typeFilter 
                      ? "Try adjusting your filters to see more results" 
                      : user?.role === 'customer' 
                        ? "You haven't placed any orders yet"
                        : "No orders have been placed yet"
                    }
                  </p>
                  {user?.role === 'customer' && (
                    <div className="space-x-2">
                      <Button>Browse Products</Button>
                      <Button variant="outline">Create Custom Order</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
