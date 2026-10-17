import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';
import { useDateFormat } from '@/hooks/use-date-format';
import { formatDateWithPreference } from '@/utils/date-format';

interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrentPage?: boolean;
}

export const Breadcrumbs = () => {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const { context } = useBreadcrumbStore();
  const { t } = useTranslation('common');
  const { dateFormat } = useDateFormat();

  useEffect(() => {
    const generateBreadcrumbs = () => {
      const pathSegments = location.pathname
        .split('/')
        .filter(segment => segment);
      const breadcrumbItems: BreadcrumbItem[] = [];

      // Add home
      breadcrumbItems.push({
        label: t('navigation.home'),
        path: '/',
        isCurrentPage: pathSegments.length === 0,
      });

      if (pathSegments.length === 0) {
        setBreadcrumbs(breadcrumbItems);
        return;
      }

      let currentPath = '';

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;

        // Handle hives section
        if (segment === 'hives') {
          breadcrumbItems.push({
            label: t('navigation.hives'),
            path: '/hives',
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // Handle inspections section
        if (segment === 'inspections') {
          // Check if we're on an inspection detail page and have hive context
          if (context.hive && context.inspection) {
            // Insert hives breadcrumb if not already there
            if (!breadcrumbItems.some(item => item.path === '/hives')) {
              breadcrumbItems.push({
                label: t('navigation.hives'),
                path: '/hives',
                isCurrentPage: false,
              });
            }
            // Add hive breadcrumb
            breadcrumbItems.push({
              label: context.hive.name,
              path: `/hives/${context.hive.id}`,
              isCurrentPage: false,
            });
          }

          breadcrumbItems.push({
            label: t('navigation.inspections'),
            path: '/inspections',
            isCurrentPage: i === pathSegments.length - 1 && !context.inspection,
          });
          continue;
        }

        // Handle queens section
        if (segment === 'queens') {
          breadcrumbItems.push({
            label: t('navigation.queens'),
            path: '/queens',
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // Handle harvests section
        if (segment === 'harvests') {
          breadcrumbItems.push({
            label: t('navigation.harvests'),
            path: '/harvests',
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // Handle create
        if (segment === 'create') {
          breadcrumbItems.push({
            label: t('actions.create'),
            path: currentPath,
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // Handle edit
        if (segment === 'edit') {
          breadcrumbItems.push({
            label: t('actions.edit'),
            path: currentPath,
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // Handle schedule
        if (segment === 'schedule') {
          breadcrumbItems.push({
            label: t('navigation.schedule'),
            path: currentPath,
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // Handle specific entity IDs using context
        if (segment.match(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i)) {
          // Check if this is a hive ID from context
          if (context.hive && segment === context.hive.id) {
            breadcrumbItems.push({
              label: context.hive.name,
              path: currentPath,
              isCurrentPage: i === pathSegments.length - 1,
            });
            continue;
          }

          // Check if this is an inspection ID from context
          if (context.inspection && segment === context.inspection.id) {
            const inspectionDate = formatDateWithPreference(
              context.inspection.date,
              dateFormat,
            );
            breadcrumbItems.push({
              label: t('breadcrumbs.inspectionFrom', { date: inspectionDate }),
              path: currentPath,
              isCurrentPage: i === pathSegments.length - 1,
            });
            continue;
          }

          // Check if this is a queen ID from context
          if (context.queen && segment === context.queen.id) {
            breadcrumbItems.push({
              label: context.queen.name || t('breadcrumbs.queen'),
              path: currentPath,
              isCurrentPage: i === pathSegments.length - 1,
            });
            continue;
          }

          // Check if this is a harvest ID from context
          if (context.harvest && segment === context.harvest.id) {
            const harvestDate = formatDateWithPreference(
              context.harvest.date,
              dateFormat,
            );
            breadcrumbItems.push({
              label: t('breadcrumbs.harvestFrom', { date: harvestDate }),
              path: currentPath,
              isCurrentPage: i === pathSegments.length - 1,
            });
            continue;
          }

          // If we don't have context for this ID, show generic "Details"
          breadcrumbItems.push({
            label: t('breadcrumbs.details'),
            path: currentPath,
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }
      }

      setBreadcrumbs(breadcrumbItems);
    };

    generateBreadcrumbs();
  }, [location, context, t, dateFormat]);

  // Don't render breadcrumbs on the homepage
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={breadcrumb.path}>
            <BreadcrumbItem>
              {breadcrumb.isCurrentPage ? (
                <BreadcrumbPage>
                  {breadcrumb.path === '/' ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    breadcrumb.label
                  )}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={breadcrumb.path}>
                    {breadcrumb.path === '/' ? (
                      <Home className="h-4 w-4" />
                    ) : (
                      breadcrumb.label
                    )}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>

            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
