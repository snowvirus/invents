import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description?: string;
    price: string;
    quality: string;
    category: string;
    business: string;
    stock: number;
    imageUrl?: string;
    extras?: Array<{
      id: number;
      name: string;
      price: string;
    }>;
  };
  compact?: boolean;
  onEdit?: (product: any) => void;
  onDelete?: (id: number) => void;
}

export default function ProductCard({ product, compact = false, onEdit, onDelete }: ProductCardProps) {
  const { user } = useAuth();
  const isAdminOrSuperAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const getQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: string | number) => {
    return `UGX ${parseFloat(price.toString()).toLocaleString()}`;
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:shadow-md transition-shadow">
        {product.imageUrl && (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-12 h-12 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{product.name}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-500">{product.category} • {product.business}</span>
            <Badge className={getQualityColor(product.quality)}>
              {product.quality}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900 currency">{formatPrice(product.price)}</p>
          <p className="text-sm text-gray-500">Stock: {product.stock}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {product.imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.category} • {product.business}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={getQualityColor(product.quality)}>
                {product.quality} Quality
              </Badge>
              <span className="text-sm text-gray-500">Stock: {product.stock}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900 currency">{formatPrice(product.price)}</p>
            {isAdminOrSuperAdmin && (
              <div className="flex space-x-1 mt-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit?.(product)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete?.(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        )}
        
        {/* Product Extras */}
        {product.extras && product.extras.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Available extras:</p>
            <div className="flex flex-wrap gap-1">
              {product.extras.map((extra) => (
                <Badge key={extra.id} variant="outline" className="text-xs">
                  {extra.name} (+{formatPrice(extra.price)})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {user?.role === 'customer' && (
            <Button size="sm" className="flex-1">
              Order Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
