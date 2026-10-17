import {
  Box,
  Container,
  Droplets,
  FlaskConical,
  Home,
  LayoutGrid,
  Shield,
  Star,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { EquipmentCategory } from 'shared-schemas';

interface CategoryStyle {
  icon: LucideIcon;
  /** Left accent border of the category card. */
  border: string;
  header: string;
  iconColor: string;
}

/**
 * Categorical accents: nine hues tell the categories apart at a glance, so
 * they stay as palette colours rather than theme tokens.
 */
export const CATEGORY_STYLES: Record<EquipmentCategory, CategoryStyle> = {
  [EquipmentCategory.BOXES]: {
    icon: Box,
    border: 'border-l-blue-400',
    header: 'bg-blue-50/80 dark:bg-blue-950/30',
    iconColor: 'text-blue-600',
  },
  [EquipmentCategory.HIVE_PARTS]: {
    icon: Home,
    border: 'border-l-slate-400',
    header: 'bg-slate-50/80 dark:bg-slate-950/30',
    iconColor: 'text-slate-600',
  },
  [EquipmentCategory.FRAMES]: {
    icon: LayoutGrid,
    border: 'border-l-amber-400',
    header: 'bg-amber-50/80 dark:bg-amber-950/30',
    iconColor: 'text-amber-600',
  },
  [EquipmentCategory.FEEDING]: {
    icon: Droplets,
    border: 'border-l-green-400',
    header: 'bg-green-50/80 dark:bg-green-950/30',
    iconColor: 'text-green-600',
  },
  [EquipmentCategory.CONSUMABLES]: {
    icon: FlaskConical,
    border: 'border-l-purple-400',
    header: 'bg-purple-50/80 dark:bg-purple-950/30',
    iconColor: 'text-purple-600',
  },
  [EquipmentCategory.TOOLS]: {
    icon: Wrench,
    border: 'border-l-orange-400',
    header: 'bg-orange-50/80 dark:bg-orange-950/30',
    iconColor: 'text-orange-600',
  },
  [EquipmentCategory.PROTECTIVE]: {
    icon: Shield,
    border: 'border-l-teal-400',
    header: 'bg-teal-50/80 dark:bg-teal-950/30',
    iconColor: 'text-teal-600',
  },
  [EquipmentCategory.EXTRACTION]: {
    icon: Container,
    border: 'border-l-yellow-400',
    header: 'bg-yellow-50/80 dark:bg-yellow-950/30',
    iconColor: 'text-yellow-600',
  },
  [EquipmentCategory.CUSTOM]: {
    icon: Star,
    border: 'border-l-gray-400',
    header: 'bg-gray-50/80 dark:bg-gray-950/30',
    iconColor: 'text-gray-600',
  },
};

export const CATEGORY_ORDER = [
  EquipmentCategory.BOXES,
  EquipmentCategory.HIVE_PARTS,
  EquipmentCategory.FRAMES,
  EquipmentCategory.FEEDING,
  EquipmentCategory.CONSUMABLES,
  EquipmentCategory.TOOLS,
  EquipmentCategory.PROTECTIVE,
  EquipmentCategory.EXTRACTION,
  EquipmentCategory.CUSTOM,
] as const;

export const categoryLabelKey = (category: EquipmentCategory) =>
  `hive:equipment.categories.${category}` as const;

/** Seven columns shared by the column header, rows and the add form. */
export const ROW_GRID = 'grid grid-cols-7 gap-4';
