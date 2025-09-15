import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
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

interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrentPage?: boolean;
}

export const Breadcrumbs = () => {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const { context } = useBreadcrumbStore();

  useEffect(() => {
    const generateBreadcrumbs = () => {
      const pathSegments = location.pathname
        .split('/')
        .filter(segment => segment);
      const breadcrumbItems: BreadcrumbItem[] = [];

      // Add home
      breadcrumbItems.push({
        label: 'Home',
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
            label: 'Hives',
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
                label: 'Hives',
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
            label: 'Inspections',
            path: '/inspections',
            isCurrentPage: i === pathSegments.length - 1 && !context.inspection,
          });
          continue;
        }

        // Handle queens section
        if (segment === 'queens') {
          breadcrumbItems.push({
            label: 'Queens',
            path: '/queens',
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // Handle harvests section
        if (segment === 'harvests') {
          breadcrumbItems.push({
            label: 'Harvests',
            path: '/harvests',
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // Handle create
        if (segment === 'create') {
          breadcrumbItems.push({
            label: 'Create',
            path: currentPath,
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // Handle edit
        if (segment === 'edit') {
          breadcrumbItems.push({
            label: 'Edit',
            path: currentPath,
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // Handle schedule
        if (segment === 'schedule') {
          breadcrumbItems.push({
            label: 'Schedule',
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
            const inspectionDate = format(
              parseISO(context.inspection.date),
              'MMM d, yyyy',
            );
            breadcrumbItems.push({
              label: `Inspection from ${inspectionDate}`,
              path: currentPath,
              isCurrentPage: i === pathSegments.length - 1,
            });
            continue;
          }

          // Check if this is a queen ID from context
          if (context.queen && segment === context.queen.id) {
            breadcrumbItems.push({
              label: context.queen.name || 'Queen',
              path: currentPath,
              isCurrentPage: i === pathSegments.length - 1,
            });
            continue;
          }

          // Check if this is a harvest ID from context
          if (context.harvest && segment === context.harvest.id) {
            const harvestDate = format(
              parseISO(context.harvest.date),
              'MMM d, yyyy',
            );
            breadcrumbItems.push({
              label: `Harvest from ${harvestDate}`,
              path: currentPath,
              isCurrentPage: i === pathSegments.length - 1,
            });
            continue;
          }

          // If we don't have context for this ID, show generic "Details"
          breadcrumbItems.push({
            label: 'Details',
            path: currentPath,
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }
      }

      setBreadcrumbs(breadcrumbItems);
    };

    generateBreadcrumbs();
  }, [location, context]);

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
                  {breadcrumb.label === 'Home' ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    breadcrumb.label
                  )}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={breadcrumb.path}>
                    {breadcrumb.label === 'Home' ? (
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
