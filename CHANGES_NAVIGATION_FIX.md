# Navigation and State Persistence Fixes

## Issues Fixed

### 1. Sidebar State Persistence ✅
**Status**: Already implemented, no changes needed
- The sidebar collapsed state is automatically persisted to localStorage with key `crm-sidebar-collapsed`
- On page refresh, the sidebar maintains its open/closed state

### 2. Scroll Position Persistence ✅
**Status**: Already implemented, no changes needed
- Both AgentLayout and AdminLayout have scroll memory implemented
- AgentLayout uses `crm-scroll-memory` key with per-section scroll positions
- AdminLayout uses `crm-scroll-admin-${adminId}` key for scroll position
- Scroll position is saved continuously while scrolling and before page refresh
- Scroll position is restored after auth check and content is ready

### 3. Navigation Issue (Back Button Requires Two Clicks) ✅
**Status**: Fixed
**Root Cause**: When clicking on property/client cards or certain links, the code was using legacy routes like `/properties/123` or `/clients/456` without the agentId/adminId prefix. This caused the RedirectToAgent/RedirectToAdmin components to trigger, adding an extra history entry. When users clicked the back button, it would first go back to the legacy route, which would then redirect again to the correct route.

**Files Modified**:

#### a) PropertyCard.tsx
- Added `useLocation` import
- Added location variable
- Modified fallback navigation to try extracting basePath from current location.pathname before using legacy route

#### b) BailleurDetailTabs.tsx
- Added `agentId` and `adminId` props to component signature
- Added `basePath` computation logic
- Changed navigation from `/properties/${c.bienConcerneId}` to `${basePath}/properties/${c.bienConcerneId}`
- Updated pages/clients/[id].tsx to pass agentId prop
- Updated pages/admin/clients/[id].tsx to pass adminId prop

#### c) properties/types.tsx
- Added `agentId` from useParams
- Changed "Nouveau résidentiel" button from `/properties/create?type=residential` to `/${agentId}/properties/add?type=residential`
- Changed "Nouveau commercial" button from `/properties/create?type=commercial` to `/${agentId}/properties/add?type=commercial`
- Changed "Nouveau terrain" button from `/properties/create?type=land` to `/${agentId}/properties/add?type=land`
- Changed "Nouveau vacances" button from `/properties/create?type=vacation` to `/${agentId}/properties/add?type=vacation`
- Changed "Nouveau bien" button from `/properties/create` to `/${agentId}/properties/add`
- Changed PropertyTypeOrb navigation from `/properties/type/${property.type}` to `/${agentId}/properties/type/${property.type}`

#### d) properties/withType.tsx
- Added `useLocation` import
- Added location variable to PropertyCardStage component
- Added location variable to PropertyRowStage component
- Modified fallback navigation in both PropertyCardStage and PropertyRowStage to try extracting basePath from current location.pathname before using legacy route

#### e) clients/types/index.tsx
- Added `useParams` import
- Added `agentId` from useParams in ClientTypesPage component
- Changed ClientTypeOrb navigation from `/clients/type/${ct.type}` to `/${agentId}/clients/type/${ct.type}`

## Impact

After these changes:
1. Sidebar state (open/closed) is maintained across page refreshes
2. Scroll position is maintained across page refreshes
3. When accessing property details or client details pages, clicking the back button once will take you to the previous page (not twice)

## Testing

To test these fixes:
1. **Sidebar**: Collapse/expand the sidebar, then refresh the page - the state should be maintained
2. **Scroll Position**: Scroll down a page, then refresh - you should stay at the same scroll position
3. **Navigation**: Click on a property or client card to view details, then click the back button - you should return to the previous page with one click
