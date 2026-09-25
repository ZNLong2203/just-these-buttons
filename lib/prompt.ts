/**
 * The instruction sent with the photo. The reader of the result is an elderly
 * person who may have memory problems, so fewer controls always wins.
 */
export function buildPrompt(task: string, language = "English"): string {
  return `This photo shows a household machine or its remote control.

An elderly person, who may have memory problems, needs to do this one task with it:
"${task}"

Find the physical controls they must use, in the order they use them. Use as few controls as possible: normally two or three, never more than five. Leave out anything optional, such as extra settings, timers or options the task does not need.

Assume the machine starts switched off, with nothing set: the person is walking up to it cold. So if it has a power or on/off button, switching it on is the first step. Look carefully: a power button is often marked only with a symbol (a circle with a line, ⏻) and no words.

For each control:
- box_2d: a tight box around the physical button or dial itself, not around its printed label. [ymin, xmin, ymax, xmax] normalized to 0-1000.
- label: the text printed on or beside the control, exactly as written on the machine and in its own script (Japanese stays Japanese). If it only has a symbol, describe the symbol briefly in ${language}.
- label_meaning: if the label is in a different language from ${language}, what it means in ${language}; otherwise leave it empty.
- action: "press" for buttons, "turn" for dials and knobs.
- instruction: one short, plain sentence in ${language}, at most 10 words, that quotes the printed label exactly as written so it can be matched by eye. If the label is in another language, follow it with its meaning in brackets. Examples in English: "Press POWER.", "Turn the big dial to COTTON.", "Press 「運転入/切」 (On/Off)." For a dial, say which printed setting to turn it to.
- confidence: "low" if you are not sure this is the right control, or the right setting on it.

Each step is a different control. If the same button has to be pressed more than once, make it one step and say how many times, for example "Press START twice." Always pick one setting; never offer a choice such as "COTTON or MIX".

Also give the card a short title in ${language} that says what the task is, for example "Wash everyday clothes".

If you cannot make out the controls in the photo (not a machine, too blurry or too dark), set photo_usable to false and return no steps.
If the task cannot be done with the controls you can see, set task_possible to false and return no steps.`;
}
