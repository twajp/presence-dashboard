// Define default dashboard settings
// These should match the DEFAULT values and backend/src/config/defaults.ts in the database

export const DEFAULT_DASHBOARD_SETTINGS = {
  team_label: 'Team',
  name_label: 'Name',
  presence_label: 'Status',
  note1_label: 'Note 1',
  note2_label: 'Note 2',
  note3_label: 'Note 3',
  check1_label: 'Check 1',
  check2_label: 'Check 2',
  check3_label: 'Check 3',
  updated_at_label: 'Last Updated',
  hide_note1: false,
  hide_note2: false,
  hide_note3: false,
  hide_check1: false,
  hide_check2: false,
  hide_check3: false,
  hide_updated_at: false,
  team_width: 120,
  name_width: 100,
  presence_width: 100,
  note1_width: 100,
  note2_width: 100,
  note3_width: 100,
  check1_width: 80,
  check2_width: 80,
  check3_width: 80,
  updated_at_width: 100,
  grid_width: 460,
  grid_height: 460,
  notes: ''
};

export const DEFAULT_USER_VALUES = {
  note1: null,
  note2: null,
  note3: null,
  check1: false,
  check2: false,
  check3: false,
  x: 0,
  y: 0,
  width: 80,
  height: 40
};
