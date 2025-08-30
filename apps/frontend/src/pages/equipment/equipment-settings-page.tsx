import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { EquipmentSettingsTable } from './components/equipment-settings-table';

export const EquipmentSettingsPage = () => {
  return (
    <Page>
      <Sidebar>
        {/* Equipment settings sidebar could be added here if needed */}
      </Sidebar>
      <MainContent>
        <EquipmentSettingsTable />
      </MainContent>
    </Page>
  );
};