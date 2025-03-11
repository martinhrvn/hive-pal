import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useHiveControllerFindOne } from 'api-client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrentPage?: boolean;
}

export const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // For retrieving hive name when on a hive detail page
  const hiveId = params.id || params.hiveId;
  const { data: hiveData } = useHiveControllerFindOne(hiveId as string, {
    query: { enabled: !!hiveId },
  });

  useEffect(() => {
    const generateBreadcrumbs = async () => {
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

        // Skip dynamic segments or handle them specially
        if (segment === 'create') {
          breadcrumbItems.push({
            label: 'Create',
            path: currentPath,
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        if (segment === 'edit') {
          breadcrumbItems.push({
            label: 'Edit',
            path: currentPath,
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

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
          breadcrumbItems.push({
            label: 'Inspections',
            path: '/inspections',
            isCurrentPage: i === pathSegments.length - 1,
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

        // Handle ID segments - use the hiveData to get the name
        if (segment === hiveId && hiveData) {
          breadcrumbItems.push({
            label: hiveData.data.name,
            path: currentPath,
            isCurrentPage: i === pathSegments.length - 1,
          });
          continue;
        }

        // If it's an ID but we don't have specific data for it
        if (segment.match(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i)) {
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
  }, [location, hiveData, hiveId]);

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
