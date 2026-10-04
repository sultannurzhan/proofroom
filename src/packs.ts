import type { Content } from './model';
export const packs: Record<string, Content> = {
  Fieldnote: {
    brand: 'Fieldnote',
    navOne: 'The journal',
    navTwo: 'Our approach',
    eyebrow: 'A practical journal · Issue 08',
    title: 'Good work starts with paying attention.',
    intro:
      'Notes on making useful things, keeping them in use, and noticing what a busy week can hide. A journal for the quietly curious.',
    sectionOneTitle: 'A small repair is a reason to look closer',
    sectionOneBody:
      'A loose chair leg. The jacket waiting by the door. We spend a morning with people who choose to mend what they already have, and find that the first useful tool is often a little patience.',
    sectionTwoTitle: 'Make room for the work that does not announce itself',
    sectionTwoBody:
      'Keeping a place running takes more than the work we photograph. Three caretakers share the lists, routines and small acts of attention that make an ordinary room feel cared for.',
    detailLabel: 'In this issue',
    detailTitle: 'Objects, habits & the spaces between',
    detailBody:
      'Six considered stories. Thirty-two pages. Printed in small batches and designed to be kept, passed on and read again.',
    cta: 'Read the latest fieldnotes',
    footer:
      'Independent notes for everyday practice. Made slowly, with attention.',
    signupTitle: 'A little attention, delivered occasionally.',
    signupIntro:
      'Leave your details for a short letter about the next issue. This is a layout specimen; no information is collected or sent.',
    nameLabel: 'What should we call you?',
    namePlaceholder: 'Your preferred name',
    nameHelp:
      'A first name is plenty. Use the name you want to see in a letter.',
    emailLabel: 'An email address for your fieldnotes',
    emailPlaceholder: 'you@example.com',
    emailHelp: 'In a real form, this is where we would send your letter.',
    error:
      'Please check this address — it needs a name, an @ sign and a domain.',
    signupButton: 'Keep me in the loop',
    signupNote:
      'A specimen, not a subscription. Your details stay on this page.',
  },
  'Common Hours': {
    brand: 'Common Hours',
    navOne: 'Workshops',
    navTwo: 'Visit the room',
    eyebrow: 'Your neighborhood, at the same table',
    title: 'There is always something we can learn from one another.',
    intro:
      'Practical workshops for neighbors with a free evening and a curious mind. Bring the thing you want to try. We will make a little room.',
    sectionOneTitle: 'Start with what you have, and see what it can become',
    sectionOneBody:
      'Our Saturday repair table welcomes wobbly stools, tired jumpers and questions that start with “I have never done this before.” Tools and patient company are included.',
    sectionTwoTitle: 'A kitchen table is a good place to begin',
    sectionTwoBody:
      'Learn a family recipe, bind a notebook or grow herbs on a narrow windowsill. Each session is led by someone from the neighborhood, with space for beginners and second attempts.',
    detailLabel: 'Next gathering · Saturday 18 April',
    detailTitle: 'Repair, refreshments and reasonable expectations',
    detailBody:
      '10:00–13:00 at the fictional Alder Street Room. Step-free entrance, quiet corner and tea. Tell the host about access needs before a real event.',
    cta: 'Explore the workshop calendar',
    footer:
      'A fictional place for shared time, useful skills and new neighbors.',
    signupTitle: 'Save a place at the neighborhood table.',
    signupIntro:
      'Try the workshop signup layout with your own words. This specimen does not reserve a seat or send any information.',
    nameLabel: 'The name you would like on your place card',
    namePlaceholder: 'Your name',
    nameHelp:
      'Whatever makes you feel welcome. Pronunciation notes would be optional.',
    emailLabel: 'Where could a workshop reminder reach you?',
    emailPlaceholder: 'neighbor@example.com',
    emailHelp:
      'Used here to show how longer labels and helpful instructions fit.',
    error:
      'That email address seems unfinished. Add the part after the @ sign.',
    signupButton: 'Request a place at the table',
    signupNote:
      'This is a specimen. No reservation or remote submission takes place.',
  },
  'Morrow Objects': {
    brand: 'Morrow Objects',
    navOne: 'The collection',
    navTwo: 'Care & repair',
    eyebrow: 'Fewer things, a longer life',
    title: 'Useful today. Repairable tomorrow.',
    intro:
      'Considered homewares with replaceable parts, honest materials and room for the marks of everyday life. Objects made to stay in use.',
    sectionOneTitle: 'Every joint has a reason to be there',
    sectionOneBody:
      'Our fictional collection begins with a task, not a trend. A lamp should light your work. A shelf should bear its load. And when something wears out, you should be able to reach it.',
    sectionTwoTitle: 'Care instructions should outlive the packaging',
    sectionTwoBody:
      'We publish clear repair notes for every object: what comes apart, which part to order and when to ask for help. Good maintenance begins with information you can actually find.',
    detailLabel: 'From the workbench',
    detailTitle: 'The everyday lamp, reconsidered from the base up',
    detailBody:
      'A steady steel base. A shade you can adjust with one hand. Standard fasteners and a replaceable cable, with a clear route to each component.',
    cta: 'See how the collection comes apart',
    footer: 'Fictional objects. A practical point of view. Keep what works.',
    signupTitle: 'Know when the next useful thing is ready.',
    signupIntro:
      'A product update form, shown as a specimen. Nothing entered here is registered, purchased or sent to a server.',
    nameLabel: 'Your preferred name for occasional updates',
    namePlaceholder: 'Your name',
    nameHelp:
      'We use this label to test a longer line at smaller screen widths.',
    emailLabel: 'Email address for product and repair updates',
    emailPlaceholder: 'you@example.com',
    emailHelp:
      'Imagine occasional notes about availability and keeping objects in use.',
    error: 'Please enter a complete email address before continuing.',
    signupButton: 'Send me the occasional useful update',
    signupNote:
      'For preview only. This button does not subscribe you to anything.',
  },
};
export const contentLabels: Record<keyof Content, string> = {
  brand: 'Brand name',
  navOne: 'First navigation label',
  navTwo: 'Second navigation label',
  eyebrow: 'Eyebrow',
  title: 'Overview title',
  intro: 'Introduction',
  sectionOneTitle: 'First section heading',
  sectionOneBody: 'First section paragraph',
  sectionTwoTitle: 'Second section heading',
  sectionTwoBody: 'Second section paragraph',
  detailLabel: 'Detail label',
  detailTitle: 'Detail heading',
  detailBody: 'Detail paragraph',
  cta: 'Call to action',
  footer: 'Footer',
  signupTitle: 'Signup heading',
  signupIntro: 'Signup instructions',
  nameLabel: 'Name field label',
  namePlaceholder: 'Name placeholder',
  nameHelp: 'Name helper text',
  emailLabel: 'Email field label',
  emailPlaceholder: 'Email placeholder',
  emailHelp: 'Email helper text',
  error: 'Error message',
  signupButton: 'Signup button',
  signupNote: 'Signup note',
};
