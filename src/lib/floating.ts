import { CARDINAL_ENABLED } from '../cardinal/config'

/* =====================================================================
   Bottom-right floating rail — single vertical axis at right-6.

   Cardinal (when enabled) anchors the corner: its orb sits at bottom-6
   and is 64px tall, topping out at 88px. Everything else stacks on the
   same axis above it, in dedicated slots, so nothing ever overlaps:

     orb row     bottom-6       — Cardinal orb (64px)
     slot 1      bottom-[100px] — pocket orb (64px), or the draft bubble
                                  when no pocket is present
     slot 2      bottom-[176px] — draft bubble shifted up while the
                                  pocket orb occupies slot 1
     panel 1     bottom-[156px] — draft flyout above a slot-1 pill
     panel 1 up  bottom-[232px] — draft flyout above a shifted pill
     pocket panel bottom-[176px] — pocket flyout above its slot-1 orb

   With Cardinal disabled the rail collapses to the original bottom-6
   positions (first widget at 24px, flyouts at 96px).
   ===================================================================== */

export const FLOATING_SLOT_1 = CARDINAL_ENABLED ? 'bottom-[100px]' : 'bottom-6'
export const FLOATING_PANEL_1 = CARDINAL_ENABLED ? 'bottom-[156px]' : 'bottom-24'
export const FLOATING_PANEL_TALL = CARDINAL_ENABLED ? 'bottom-[176px]' : 'bottom-24'

/* Panel heights keep the top edge ~64px below the viewport top,
   mirroring the original `calc(100vh - 160px)` at bottom-96. */
export const FLOATING_PANEL_MAX_H = CARDINAL_ENABLED ? 'calc(100vh - 220px)' : 'calc(100vh - 160px)'
export const FLOATING_PANEL_LIST_H = CARDINAL_ENABLED ? 'calc(100vh - 320px)' : 'calc(100vh - 260px)'
export const FLOATING_PANEL_TALL_MAX_H = CARDINAL_ENABLED ? 'calc(100vh - 240px)' : 'calc(100vh - 160px)'

/* Draft bubble shifted one slot up: the pocket orb took slot 1. */
export const FLOATING_SLOT_1_SHIFTED = CARDINAL_ENABLED ? 'bottom-[176px]' : 'bottom-[100px]'
export const FLOATING_PANEL_1_SHIFTED = CARDINAL_ENABLED ? 'bottom-[232px]' : 'bottom-[156px]'
export const FLOATING_PANEL_MAX_H_SHIFTED = CARDINAL_ENABLED ? 'calc(100vh - 296px)' : 'calc(100vh - 220px)'
export const FLOATING_PANEL_LIST_H_SHIFTED = CARDINAL_ENABLED ? 'calc(100vh - 396px)' : 'calc(100vh - 320px)'

/* Qualification pocket orb: same 64px volume as the Cardinal orb,
   stacked directly above it on the same axis. With Cardinal off it
   takes the corner itself. */
export const FLOATING_POCKET_ANCHOR = CARDINAL_ENABLED ? 'bottom-[100px] right-6' : 'bottom-6 right-6'

/* Pocket flyout opens just above its orb. It is `absolute` inside the
   fixed container (which is anchored at the orb itself), so this is a
   container-relative offset: 64px orb + 12px gap. Viewport-wise the
   panel bottom edge lands at slot + 76px (176px with Cardinal on). */
export const FLOATING_POCKET_PANEL = 'bottom-[76px]'
export const FLOATING_POCKET_LIST_H = CARDINAL_ENABLED
  ? 'min(calc(100vh - 304px), 420px)'
  : 'min(calc(100vh - 228px), 420px)'
