import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import FileUpload from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package, 
  Upload, 
  MapPin, 
  Lightbulb,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const customOrderSchema = z.object({
  type: z.literal("custom"),
  description: z.string().min(10, "Please provide a detailed description (at least 10 characters)"),
  location: z.string().min(1, "Delivery location is required"),
  preferredMaterial: z.string().optional(),
  dimensions: z.string().optional(),
  budget: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]),
  businessPreference: z.enum(["nsambya", "mirembe", "any"]),
  additionalNotes: z.string().optional(),
});

export default function CustomOrder() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const form = useForm<z.infer<typeof customOrderSchema>>({
    resolver: zodResolver(customOrderSchema),
    defaultValues: {
      type: "custom",
      description: "",
      location: "",
      preferredMaterial: "",
      dimensions: "",
      budget: "",
      urgency: "medium",
      businessPreference: "any",
      additionalNotes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        body: data,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your custom order has been submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsSubmitted(true);
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
        description: "Failed to submit your custom order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof customOrderSchema>) => {
    const formData = new FormData();
    
    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value.toString());
      }
    });

    // Add image file if selected
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    createOrderMutation.mutate(formData);
  };

  const resetForm = () => {
    form.reset();
    setSelectedFile(null);
    setIsSubmitted(false);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Submitted!</h2>
                <p className="text-gray-600 mb-6">
                  Thank you for your custom order request. Our team will review it and get back to you soon.
                </p>
                <div className="space-y-3">
                  <Button onClick={resetForm} className="w-full">
                    Submit Another Order
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                    Back to Dashboard
                  </Button>
                </div>
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
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Custom Order Request</h1>
                <p className="text-sm text-gray-500">
                  Tell us about your custom furniture or bedding needs and we'll create it for you
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Order Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description of Your Request</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Please describe in detail what you would like us to create. Include style preferences, intended use, and any specific requirements..."
                                  rows={4}
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                The more details you provide, the better we can meet your expectations
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="preferredMaterial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preferred Material (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Mahogany, Cotton, Leather" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dimensions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dimensions (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 6ft x 4ft x 2ft" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="budget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Budget Range (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., UGX 500,000 - 1,000,000" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Help us recommend appropriate materials and design
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="urgency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Urgency Level</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select urgency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Low - No rush</SelectItem>
                                    <SelectItem value="medium">Medium - Within a month</SelectItem>
                                    <SelectItem value="high">High - ASAP</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="businessPreference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Preference</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select business" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="any">Any - Let you decide</SelectItem>
                                  <SelectItem value="nsambya">Nsambya Furniture Workshop</SelectItem>
                                  <SelectItem value="mirembe">Mirembe Beddings</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose based on specialization or leave it to us
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Location</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Kampala, Nakawa Division" {...field} />
                              </FormControl>
                              <FormDescription>
                                This helps us calculate delivery costs and logistics
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <FormLabel>Design Reference (Optional)</FormLabel>
                          <div className="mt-2">
                            <FileUpload
                              onFileSelect={setSelectedFile}
                              accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Upload an image showing your desired design, sketch, or reference photo
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="additionalNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any other important details, special requests, or questions..."
                                  rows={3}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-3 pt-4">
                          <Button type="button" variant="outline" onClick={() => form.reset()}>
                            Clear Form
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createOrderMutation.isPending}
                            className="min-w-32"
                          >
                            {createOrderMutation.isPending ? "Submitting..." : "Submit Order"}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar with tips and info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5" />
                      <span>Tips for Better Orders</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Be Specific</h4>
                      <p className="text-sm text-gray-600">
                        Include measurements, colors, materials, and intended use to get accurate quotes.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Include References</h4>
                      <p className="text-sm text-gray-600">
                        Photos or sketches help us understand your vision better.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Timeline Planning</h4>
                      <p className="text-sm text-gray-600">
                        Custom work typically takes 2-4 weeks depending on complexity.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Our Specialties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2 nsambya-brand text-white p-2 rounded">
                        Nsambya Furniture
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Custom dining sets</li>
                        <li>• Bedroom furniture</li>
                        <li>• Office furniture</li>
                        <li>• Storage solutions</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2 mirembe-brand text-white p-2 rounded">
                        Mirembe Beddings
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Custom mattresses</li>
                        <li>• Duvet sets</li>
                        <li>• Curtains & nets</li>
                        <li>• Hotel bedding</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Contact Info</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium">Response Time</p>
                      <p className="text-gray-600">We typically respond within 24 hours</p>
                    </div>
                    <div>
                      <p className="font-medium">Delivery Areas</p>
                      <p className="text-gray-600">Kampala and surrounding areas</p>
                    </div>
                    <div>
                      <p className="font-medium">Payment</p>
                      <p className="text-gray-600">50% deposit, 50% on completion</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
