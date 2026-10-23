import {
  Banknote, BookOpen, Briefcase, Car, Dumbbell, Gift, GraduationCap, HeartPulse, Home, Laptop, PartyPopper, PawPrint, Plane,
  ShoppingCart, Tag, User, Utensils, Wallet, type LucideIcon,
} from 'lucide-react';

/** Ícones permitidos nas categorias. A chave é o que o backend armazena. */
export const categoryIcons: Record<string, { icon: LucideIcon; name: string }> = {
  home: { icon: Home, name: 'Casa' },
  utensils: { icon: Utensils, name: 'Alimentação' },
  car: { icon: Car, name: 'Carro' },
  'heart-pulse': { icon: HeartPulse, name: 'Saúde' },
  'graduation-cap': { icon: GraduationCap, name: 'Educação' },
  'party-popper': { icon: PartyPopper, name: 'Lazer' },
  user: { icon: User, name: 'Pessoal' },
  laptop: { icon: Laptop, name: 'Tecnologia' },
  banknote: { icon: Banknote, name: 'Dinheiro' },
  'shopping-cart': { icon: ShoppingCart, name: 'Compras' },
  plane: { icon: Plane, name: 'Viagem' },
  gift: { icon: Gift, name: 'Presente' },
  briefcase: { icon: Briefcase, name: 'Trabalho' },
  wallet: { icon: Wallet, name: 'Carteira' },
  'paw-print': { icon: PawPrint, name: 'Pet' },
  'book-open': { icon: BookOpen, name: 'Livros' },
  dumbbell: { icon: Dumbbell, name: 'Academia' },
};

export const iconFor = (key: string | null | undefined): LucideIcon => (key && categoryIcons[key]?.icon) || Tag;
