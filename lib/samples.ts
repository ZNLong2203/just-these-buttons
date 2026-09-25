/**
 * Real photos anyone can try without a machine to hand. All are openly
 * licensed from Wikimedia Commons (resized); the credit is shown next to the
 * photo and printed on the card. See docs/photo-credits.md.
 */

export type Credit = {
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
};

export type Sample = {
  id: string;
  /** Button text: what the machine is. */
  label: string;
  path: string;
  task: string;
  credit: Credit;
};

export const SAMPLES: Sample[] = [
  {
    id: "washing-machine",
    label: "Washing machine",
    path: "/samples/washing-machine.jpg",
    task: "wash everyday clothes",
    credit: {
      author: "GOSUAN Waongeai",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      source: "https://commons.wikimedia.org/wiki/File:HK_home_machine_washing_control_button_panel_August_2021_SS2.jpg",
    },
  },
  {
    id: "microwave",
    label: "Microwave",
    path: "/samples/microwave.jpg",
    task: "heat a bowl of soup for one minute",
    credit: {
      author: "Ischa1 at Dutch Wikipedia",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      source: "https://commons.wikimedia.org/wiki/File:BedieningspaneelProLineSM117.jpg",
    },
  },
  {
    id: "tv-remote",
    label: "TV remote",
    path: "/samples/tv-remote.jpg",
    task: "turn on the TV",
    credit: {
      author: "Raimond Spekking",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      source: "https://commons.wikimedia.org/wiki/File:Television_remote_control_-_unbranded-4028.jpg",
    },
  },
];
