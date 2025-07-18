import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Bed, Sofa, Users, MessageCircle, ShoppingCart } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Nsambya & Mirembe</h1>
              <p className="text-xs text-gray-500">Business Management System</p>
            </div>
          </div>
          <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Manage Your <span className="text-primary">Furniture</span> &{" "}
            <span className="text-secondary">Bedding</span> Business
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive platform to manage products, orders, customer inquiries, and real-time communication 
            across multiple business branches.
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-3">
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Run Your Business
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Sofa className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Product Management</CardTitle>
                <CardDescription>
                  Manage your furniture and bedding inventory with detailed descriptions, pricing, and extras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Add product photos and descriptions</li>
                  <li>• Set quality levels and pricing</li>
                  <li>• Manage extras like pillowcases, nets</li>
                  <li>• Track stock levels</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ShoppingCart className="h-12 w-12 text-secondary mb-4" />
                <CardTitle>Order Processing</CardTitle>
                <CardDescription>
                  Handle customer orders, inquiries, and custom requests efficiently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Process standard and custom orders</li>
                  <li>• Handle customer inquiries</li>
                  <li>• Track order status and delivery</li>
                  <li>• Upload design images for custom work</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Real-time Chat</CardTitle>
                <CardDescription>
                  Communicate instantly with customers and team members across all branches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Real-time messaging system</li>
                  <li>• Tag users and branches</li>
                  <li>• Role-based chat display</li>
                  <li>• Message moderation tools</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Building2 className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Multi-Branch Support</CardTitle>
                <CardDescription>
                  Manage multiple business locations with branch-specific admin assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Create and manage branches</li>
                  <li>• Assign admins to branches</li>
                  <li>• Shared product catalog</li>
                  <li>• Branch-specific dashboards</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Role Management</CardTitle>
                <CardDescription>
                  Different access levels for SuperAdmins, Admins, and Customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• SuperAdmin: Full system control</li>
                  <li>• Admin: Branch-specific management</li>
                  <li>• Customer: Shopping and inquiries</li>
                  <li>• Secure authentication</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Bed className="h-12 w-12 text-pink-600 mb-4" />
                <CardTitle>Specialized Catalogs</CardTitle>
                <CardDescription>
                  Dedicated sections for furniture and bedding with appropriate extras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Nsambya Furniture Workshop</li>
                  <li>• Mirembe Beddings</li>
                  <li>• Category-specific features</li>
                  <li>• Quality ratings and filters</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of furniture and bedding businesses that trust our platform 
            to manage their operations efficiently.
          </p>
          <Button onClick={handleLogin} size="lg" variant="secondary" className="text-lg px-8 py-3">
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building2 className="h-6 w-6" />
            <span className="text-lg font-semibold">Nsambya & Mirembe Business System</span>
          </div>
          <p className="text-gray-400">
            Comprehensive business management for furniture and bedding companies
          </p>
        </div>
      </footer>
    </div>
  );
}
