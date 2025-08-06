
import { useParams } from 'react-router-dom';

export default function ProductDetailPage() {
  const { id } = useParams();

  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold mb-4">Détail du produit</h1>
      <p className="text-gray-600">ID du produit : {id}</p>
      <p className="text-gray-500 mt-4">Page en cours de développement...</p>
    </div>
  );
} 