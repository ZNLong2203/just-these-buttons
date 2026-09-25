# Photo credits

## In the app

The sample photos in `public/samples/` are from Wikimedia Commons. They were resized to at most 1600 px and re-encoded as JPEG, with no other changes. Each photo keeps its original licence, and the credit is shown next to the photo in the app and printed on the card.

| File | Photo | Author | Licence |
|---|---|---|---|
| `washing-machine.jpg` | [HK home machine washing control button panel August 2021 SS2](https://commons.wikimedia.org/wiki/File:HK_home_machine_washing_control_button_panel_August_2021_SS2.jpg) | GOSUAN Waongeai | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `microwave.jpg` | [BedieningspaneelProLineSM117](https://commons.wikimedia.org/wiki/File:BedieningspaneelProLineSM117.jpg) | Ischa1 at Dutch Wikipedia | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `japanese-ac-remote.jpg` | [Air conditioner remote - Japan - 2024 sept 8](https://commons.wikimedia.org/wiki/File:Air_conditioner_remote_-_Japan_-_2024_sept_8.jpeg) | Nesnad | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `tv-remote.jpg` | [Television remote control - unbranded-4028](https://commons.wikimedia.org/wiki/File:Television_remote_control_-_unbranded-4028.jpg) | Raimond Spekking | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

The app's code is MIT-licensed (see `LICENSE`). The MIT licence does not cover these photos.

## Vision probe

`npm run probe:real` downloads more Commons photos into `probe/`. That folder is not committed, and the script records each photo's author and licence in `probe/credits.json`. `npm run probe:photos` generates photorealistic test photos with a Gemini image model, and those are not committed either.

## Screenshots in docs/images

The screenshots in `docs/images/` show the sample photos above inside the app, under the same licences.
