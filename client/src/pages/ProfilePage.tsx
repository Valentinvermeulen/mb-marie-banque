
import { useAuth } from '../hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold mb-4">Mon Profil</h1>
      {user && (
        <div className="space-y-2">
          <p><strong>Nom :</strong> {user.name}</p>
          <p><strong>Email :</strong> {user.email}</p>
          <p><strong>Nom d'utilisateur :</strong> {user.username}</p>
          {user.location && <p><strong>Localisation :</strong> {user.location}</p>}
          {user.bio && <p><strong>Bio :</strong> {user.bio}</p>}
        </div>
      )}
      <p className="text-gray-500 mt-8">Page en cours de développement...</p>
    </div>
  );
} 