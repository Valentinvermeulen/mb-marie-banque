import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Heart, Eye, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  condition: string;
  views: number;
  likes: number;
  createdAt: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  categoryName: string;
  brandName?: string;
  sizeName?: string;
  colorName?: string;
  primaryImage?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    sort: 'newest'
  });

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await fetch('/api/brands');
      if (!response.ok) throw new Error('Failed to fetch brands');
      return response.json();
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) return;
    
    try {
      await fetch(`/api/products/${productId}/favorite`, {
        method: 'POST',
        credentials: 'include',
      });
      // Refetch products to update likes count
      window.location.reload();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getConditionLabel = (condition: string) => {
    const conditions = {
      new: 'Neuf',
      like_new: 'Comme neuf',
      good: 'Bon état',
      fair: 'Correct',
      poor: 'Usé'
    };
    return conditions[condition as keyof typeof conditions] || condition;
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      new: 'bg-green-100 text-green-800',
      like_new: 'bg-blue-100 text-blue-800',
      good: 'bg-yellow-100 text-yellow-800',
      fair: 'bg-orange-100 text-orange-800',
      poor: 'bg-red-100 text-red-800'
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">
            Achetez et vendez des vêtements d'occasion
          </h1>
          <p className="text-xl mb-6 opacity-90">
            Donnez une seconde vie à vos vêtements et trouvez des pièces uniques à prix réduits
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
              <Link to="/search">Parcourir</Link>
            </Button>
            {user && (
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
                <Link to="/sell">Vendre maintenant</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="Rechercher des articles..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les catégories</SelectItem>
              {categories?.map((category: Category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.brand} onValueChange={(value) => handleFilterChange('brand', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Marque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les marques</SelectItem>
              {brands?.map((brand: Brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Plus récents</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
              <SelectItem value="popular">Plus populaires</SelectItem>
              <SelectItem value="likes">Plus aimés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productsData?.products?.map((product: Product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow">
            <Link to={`/product/${product.id}`}>
              <div className="relative aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={product.primaryImage || 'https://via.placeholder.com/300x300?text=Image+manquante'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                {product.originalPrice && product.originalPrice > product.price && (
                  <Badge className="absolute top-2 left-2 bg-red-500">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(product.id);
                  }}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </Link>
            
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-medium text-gray-900 truncate hover:text-teal-600">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 truncate">
                      {product.brandName && `${product.brandName} • `}
                      {product.sizeName && `${product.sizeName} • `}
                      {product.colorName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <Badge className={getConditionColor(product.condition)}>
                    {getConditionLabel(product.condition)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{product.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>{product.likes}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{product.sellerRating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <img
                    src={product.sellerAvatar || 'https://via.placeholder.com/24x24'}
                    alt={product.sellerName}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-600 truncate">
                    {product.sellerName}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {productsData?.products?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          <p className="text-gray-400">Essayez de modifier vos filtres</p>
        </div>
      )}
    </div>
  );
} 