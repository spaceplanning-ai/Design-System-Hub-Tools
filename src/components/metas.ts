/**
 * Central registry of all component metadata.
 *
 * IMPORTANT: this file imports only pure `*.meta.ts` modules (no React, no CSS),
 * so it is safe to import from the Node manifest generator (scripts/build-manifest.ts)
 * as well as from the browser (Foundations docs).
 */
import type { ComponentMeta } from '../core/types';

// Atoms
import { iconMeta } from './atoms/Icon/Icon.meta';
import { buttonMeta } from './atoms/Button/Button.meta';
import { iconButtonMeta } from './atoms/IconButton/IconButton.meta';
import { textMeta } from './atoms/Text/Text.meta';
import { labelMeta } from './atoms/Label/Label.meta';
import { linkMeta } from './atoms/Link/Link.meta';
import { inputMeta } from './atoms/Input/Input.meta';
import { textareaMeta } from './atoms/Textarea/Textarea.meta';
import { checkboxMeta } from './atoms/Checkbox/Checkbox.meta';
import { radioMeta } from './atoms/Radio/Radio.meta';
import { switchMeta } from './atoms/Switch/Switch.meta';
import { badgeMeta } from './atoms/Badge/Badge.meta';
import { tagMeta } from './atoms/Tag/Tag.meta';
import { chipMeta } from './atoms/Chip/Chip.meta';
import { avatarMeta } from './atoms/Avatar/Avatar.meta';
import { dividerMeta } from './atoms/Divider/Divider.meta';
import { spinnerMeta } from './atoms/Spinner/Spinner.meta';
import { progressMeta } from './atoms/Progress/Progress.meta';
import { tooltipMeta } from './atoms/Tooltip/Tooltip.meta';
import { imageMeta } from './atoms/Image/Image.meta';
import { skeletonMeta } from './atoms/Skeleton/Skeleton.meta';
import { sliderMeta } from './atoms/Slider/Slider.meta';
import { sparklineMeta } from './atoms/Sparkline/Sparkline.meta';
import { socialLoginButtonMeta } from './atoms/SocialLoginButton/SocialLoginButton.meta';

// Molecules
import { formFieldMeta } from './molecules/FormField/FormField.meta';
import { textFieldMeta } from './molecules/TextField/TextField.meta';
import { searchInputMeta } from './molecules/SearchInput/SearchInput.meta';
import { selectMeta } from './molecules/Select/Select.meta';
import { tabsMeta } from './molecules/Tabs/Tabs.meta';
import { accordionMeta } from './molecules/Accordion/Accordion.meta';
import { breadcrumbMeta } from './molecules/Breadcrumb/Breadcrumb.meta';
import { paginationMeta } from './molecules/Pagination/Pagination.meta';
import { cardMeta } from './molecules/Card/Card.meta';
import { listItemMeta } from './molecules/ListItem/ListItem.meta';
import { dropdownMeta } from './molecules/Dropdown/Dropdown.meta';
import { socialLoginMeta } from './molecules/SocialLogin/SocialLogin.meta';
import { emptyStateMeta } from './molecules/EmptyState/EmptyState.meta';
import { popoverMeta } from './molecules/Popover/Popover.meta';
import { comboboxMeta } from './molecules/Combobox/Combobox.meta';
import { autocompleteMeta } from './molecules/Autocomplete/Autocomplete.meta';
import { datePickerMeta } from './molecules/DatePicker/DatePicker.meta';
import { fileUploadMeta } from './molecules/FileUpload/FileUpload.meta';
import { imageUploadMeta } from './molecules/ImageUpload/ImageUpload.meta';
import { barChartMeta } from './molecules/BarChart/BarChart.meta';
import { lineChartMeta } from './molecules/LineChart/LineChart.meta';
import { donutChartMeta } from './molecules/DonutChart/DonutChart.meta';
import { radarChartMeta } from './molecules/RadarChart/RadarChart.meta';
import { gaugeMeta } from './molecules/Gauge/Gauge.meta';
import { scatterChartMeta } from './molecules/ScatterChart/ScatterChart.meta';
import { heatmapMeta } from './molecules/Heatmap/Heatmap.meta';
import { menuMeta } from './molecules/Menu/Menu.meta';

// Organisms
import { alertMeta } from './organisms/Alert/Alert.meta';
import { modalMeta } from './organisms/Modal/Modal.meta';
import { drawerMeta } from './organisms/Drawer/Drawer.meta';
import { toastMeta } from './organisms/Toast/Toast.meta';
import { tableMeta } from './organisms/Table/Table.meta';
import { headerMeta } from './organisms/Header/Header.meta';
import { footerMeta } from './organisms/Footer/Footer.meta';
import { sidebarMeta } from './organisms/Sidebar/Sidebar.meta';
import { navbarMeta } from './organisms/Navbar/Navbar.meta';

export const atomMetas: ComponentMeta[] = [
  iconMeta,
  buttonMeta,
  iconButtonMeta,
  textMeta,
  labelMeta,
  linkMeta,
  inputMeta,
  textareaMeta,
  checkboxMeta,
  radioMeta,
  switchMeta,
  badgeMeta,
  tagMeta,
  chipMeta,
  avatarMeta,
  dividerMeta,
  spinnerMeta,
  progressMeta,
  tooltipMeta,
  imageMeta,
  skeletonMeta,
  sliderMeta,
  sparklineMeta,
  socialLoginButtonMeta,
];

export const moleculeMetas: ComponentMeta[] = [
  formFieldMeta,
  textFieldMeta,
  searchInputMeta,
  selectMeta,
  tabsMeta,
  accordionMeta,
  breadcrumbMeta,
  paginationMeta,
  cardMeta,
  listItemMeta,
  dropdownMeta,
  socialLoginMeta,
  emptyStateMeta,
  popoverMeta,
  comboboxMeta,
  autocompleteMeta,
  datePickerMeta,
  fileUploadMeta,
  imageUploadMeta,
  menuMeta,
  barChartMeta,
  lineChartMeta,
  donutChartMeta,
  radarChartMeta,
  gaugeMeta,
  scatterChartMeta,
  heatmapMeta,
];

export const organismMetas: ComponentMeta[] = [
  alertMeta,
  modalMeta,
  drawerMeta,
  toastMeta,
  tableMeta,
  headerMeta,
  footerMeta,
  sidebarMeta,
  navbarMeta,
];

/** Every component meta, in Atomic-Design order. This drives the Figma manifest. */
export const componentMetas: ComponentMeta[] = [...atomMetas, ...moleculeMetas, ...organismMetas];
