/**
 * In-app help per admin page, for staff and board members who are new every year. Keyed by the
 * page's route; the "Help" button next to each page title opens the matching guide. Write for
 * non-technical readers, say which site a change shows up on, and keep it in step with the code
 * (the definition of done asks for it). Supports **bold**, *italic*, `code`, `## ` headings,
 * `- ` bullets and `1. ` steps. A test checks that every page in the navigation has a guide.
 */
export interface GuideSection {
  title: string
  content: string
}

export interface Guide {
  title: string
  sections: GuideSection[]
}

const ACCESS = `Everyone signs in with their Hubble or Meteor Microsoft account and must be in the staff group. A first sign-in gives you **no access yet**: you only see the dashboard until an admin gives you access on the **Users** page.

Access is set **per tab**. For each tab (menu, daily dish, events, and so on) an admin picks one of:

- **Hidden**: the tab is not shown to you at all.
- **View**: you can open the tab and look, but not change anything.
- **Edit**: you can change what the tab manages.

**Admins** have full access to every tab, and also manage users and read the audit log.

If a tab or button you expect is missing, you probably do not have access to it. Ask an admin.`

export const GUIDES: Record<string, Guide> = {
  '/': {
    title: 'Getting started',
    sections: [
      {
        title: 'What this admin does',
        content: `This admin manages the content of both public websites, **hubble.cafe** and **meteor.cafe**, in one place. Most changes are live on the site right away: there is no separate publish step unless a module says so (events have a *published* switch).

## Where things show up
- **Menu**, **opening hours**, **events** and the **board** are set per cafe and appear on that cafe's site.
- The **daily dish**, **vacancies**, **associations** and the supervisory board only have a page on the Hubble site.
- Anything marked **Shared** appears for both cafes.

The dashboard shows today's dish, upcoming events and special opening hours, so you can spot what needs attention.

## Unsaved changes
If you have typed something in a form and click another page (or the back button), the admin asks whether to **discard your changes** or **keep editing**, so a mis-tap does not lose your work. Closing the tab shows a similar warning from your browser.`,
      },
      { title: 'Your access', content: ACCESS },
      {
        title: 'Every change is recorded',
        content: `Each change made here is written to the **audit log** with who made it and what changed, so mistakes can be traced and fixed. Admins can read it.

Accounts that have not signed in for a year are removed automatically (never admin accounts). Signing in again gives you a fresh account without access, so ask an admin to set it again.`,
      },
    ],
  },

  '/menu': {
    title: 'Menu',
    sections: [
      {
        title: 'Tabs, sub-headings and items',
        content: `The menu has three levels:

1. **Tabs** (for example *Drinks* or *Food*). Each tab belongs to **one cafe**, chosen with *Visible on*.
2. **Sub-headings** inside a tab (for example *Beers*). They follow the cafe of their tab.
3. **Items**, with a name, price and optional description, dietary tags, allergens, size options and image.

Changes are live on the menu page of that cafe straight away.`,
      },
      {
        title: 'TU/e student prices',
        content: `Every item has a **regular price** and an optional **TU/e student price**. When both are set, the site shows them as \`regular/student\`, for example \`3,00/2,50\`.

Leave the student price empty for items without a discount. To change many prices at once, use the checkboxes and **bulk edit** (see *Hiding and bulk edits*).`,
      },
      {
        title: 'Hiding and bulk edits',
        content: `Use the eye button to hide something from the site without deleting it:

- Hide an **item** when it is sold out.
- Hide a **sub-heading** or a whole **tab** to take everything under it off the site, for example a seasonal menu.

Hiding a tab or sub-heading does not change the items inside it: when you show it again, exactly the items that were visible before come back.

## Bulk edit
Tick the checkboxes of several items to set one price for all of them, remove their student price, or move them to another sub-heading. The bar at the bottom lists what will change before you apply.`,
      },
      {
        title: 'Changing the order',
        content: `Drag the handle next to a tab, sub-heading or item to change its position; the site follows the same order. It also works with the keyboard (focus the handle, press space, use the arrow keys, press space again) and by touch on a phone.`,
      },
    ],
  },

  '/daily-dish': {
    title: 'Daily dish',
    sections: [
      {
        title: 'Posting the daily dinner dish',
        content: `The Daily Dinner Dish is shown on its own page on the **Hubble** site, on the day it is served.

1. Pick the **date** the dish is served.
2. Give it a **name**, and optionally a description, price and photo.
3. Save. The site shows it on that date, so you can post the dishes for a whole week in advance.

You need **Edit** access on the Daily dish tab to post dishes; with **View** you can only look.`,
      },
    ],
  },

  '/hours': {
    title: 'Opening hours',
    sections: [
      {
        title: 'Weekly schedule',
        content: `Choose the cafe at the top, then set the standing hours for each day of the week, with optional kitchen hours. A day without hours counts as **closed**.

The weekly schedule is shown on the home page and in the footer of that cafe's site.`,
      },
      {
        title: 'Date overrides',
        content: `Use an **override** for a single date that differs from the normal week: a holiday, a closing for an event, or different hours. Add a short **note** (for example *Christmas* or *LED Party*). Upcoming overrides appear on the site under *Special dates*.

- **Closed**: the cafe is closed that day.
- **Special hours (open)**: give an **opening and a closing time** for a partial opening, for example 20:00 to 02:00 (a closing time before the opening time means past midnight). The site then shows those times. Leave both empty to show plain *Open*.

Use the pencil next to an override to change its date, status, times or note. There can be only one override per date for each cafe.`,
      },
      {
        title: 'The open or closed banner',
        content: `The coloured banner at the top of the site is decided **per day**, not per hour:

- If today has an **override**, it decides: *closed* shows the closed banner, and its **note** becomes the banner text (an open day with a note shows that note).
- Otherwise a day **without standing hours** shows the closed banner all day, and a normal opening day shows **no banner**, also outside opening time.

So to announce something for one day, add an override for that day with a note.`,
      },
    ],
  },

  '/events': {
    title: 'Events',
    sections: [
      {
        title: 'Adding an event',
        content: `Choose the cafe, then add the event with a **title**, **date** and optionally a start time, price, description, image and a **sign-up link**.

- Only **published** events appear on the site; leave *published* off to prepare an event as a draft.
- Only upcoming events are shown. Past events disappear from the site by themselves.
- Hubble events show on hubble.cafe, Meteor events on the Meteor agenda.`,
      },
    ],
  },

  '/board': {
    title: 'Board',
    sections: [
      {
        title: 'Terms and members',
        content: `The board is organised in **terms** (for example *Board 2026*), each with its **members**, their role and a photo.

- A term is either **executive** or **supervisory**.
- A term is **Shared** or belongs to one cafe.
- Mark the sitting board as **Current**.

Add a **photo credit** to show who took the photos, and a **group photo** for how the term appears among previous boards.`,
      },
      {
        title: 'Where terms appear',
        content: `- The **current** executive board is shown on the *Board* page of both sites.
- **Previous boards** (executive terms that are not current) are listed per cafe: each site shows its own terms plus the shared ones.
- The **supervisory board** has its own page on the Hubble site.

When a new board starts, add the new term, mark it **Current**, and turn *Current* off on the old one so it moves to previous boards.`,
      },
    ],
  },

  '/vacancies': {
    title: 'Vacancies',
    sections: [
      {
        title: 'Open positions',
        content: `Vacancies are listed on the **Hubble** site under *Open positions*. Give each a title, and optionally a description, hours, type, image and how to apply (an email address or a link).

- Only **active** vacancies are shown; switch one off when it is filled instead of deleting it.
- Use **Shared** or **Hubble** for the cafe. The Meteor site has no vacancies page, so a vacancy for Meteor only is not shown anywhere.`,
      },
    ],
  },

  '/associations': {
    title: 'Associations',
    sections: [
      {
        title: 'Connected study associations',
        content: `The associations are shown with their logo on the **Hubble** site, sorted alphabetically. Add the name and upload the logo from the media library.

Use **Shared** or **Hubble** for the cafe: the Meteor site has no associations page, so an association for Meteor only is not shown anywhere.`,
      },
    ],
  },

  '/media': {
    title: 'Media library',
    sections: [
      {
        title: 'Uploading images',
        content: `Images uploaded here can be picked for events, board members, menu items, vacancies and associations.

- Use **JPEG, PNG, WebP or GIF**, up to **10 MB**.
- Always fill in the **alt text**: it describes the image for visitors who use a screen reader.
- The **bar** label only keeps the library organised.

Location and camera details stored inside photos are removed automatically when you upload, so a photo never reveals where it was taken.

An image that is still shown somewhere cannot be deleted: the admin tells you what uses it (for example *the event 'Pub quiz'*). Pick another image, or none, there first, then delete it here.`,
      },
    ],
  },

  '/screens': {
    title: 'Screens',
    sections: [
      {
        title: 'Switching the screens',
        content: `This page controls the **Aurora** screens in the bar. Choose a scene for all screens at once:

- **Open**: the normal poster carousel.
- **Last call**: the last call slide.
- **Closed**: the closed slide.

You need **Edit** access on Screens to switch the scene; with **View** you see what the screens show but cannot switch them. The page always reads the screens' real state back; **Mixed** means the screens currently show different things, for example after someone changed one directly in Aurora.`,
      },
      {
        title: 'Choosing the slides',
        content: `People with access to **Screen posters** choose which poster each scene shows. If a scene has no poster configured, switching to it is refused, rather than showing the wrong slide.`,
      },
      {
        title: 'Poster requests from the website',
        content: `Associations request a poster with the form on the Hubble website. The request goes straight into **Aurora**, under **Poster requests**, where the screens team reviews, edits and approves or denies it. It is not handled on this page.

The screens mailbox gets a short email for every request, as a reminder to review it in Aurora. If Aurora could not be reached, that email says the request is **not** in Aurora and has the poster attached: add it to Aurora yourself. Replying to the requester is done by email, Aurora does not do it for you.`,
      },
    ],
  },

  '/users': {
    title: 'Users',
    sections: [
      { title: 'How access works', content: ACCESS },
      {
        title: 'Changing someone\'s access',
        content: `Click **Change access** next to the person. For each tab choose **Hidden**, **View** or **Edit**, then click **Save access**. It applies from their next action in the admin.

- **Start from** fills in every tab at once: **Viewer** (look at everything and switch the screens), **DDD poster** (a viewer who can also post the daily dish), **Editor** (change everything except users and the audit log) or **No access**. You can then adjust single tabs.
- **Admin** gives full access to every tab, plus managing users and the audit log.
- Edit on **Board**, **Vacancies** or **Associations** also lets someone upload images for those pages. Deleting images from the library needs Edit on **Media**.

You cannot change your own access, so there is always another admin involved. Every change is written to the audit log.

People who leave do not need to be removed by hand: accounts that have not signed in for a year are removed automatically (never admin accounts).`,
      },
    ],
  },

  '/audit': {
    title: 'Audit log',
    sections: [
      {
        title: 'Reading the audit log',
        content: `Every change made in the admin is listed here, newest first, with **who** made it, **what** changed and **when**. Filter by module or kind of change to find something quickly.

Click **Show changes** under an entry to see exactly what was changed: the old value struck through, followed by the new one. For something that was added, **Show values** lists what it was created with; for something deleted, **Show last values** lists what it held, so it can be put back by hand. Saving a form without changing anything adds no entry.

To protect privacy, the name and email of the person are removed from entries older than a year, and entries older than two years are deleted.`,
      },
    ],
  },
}

/** The guide for a route, or undefined for pages without one. */
export function guideFor(pathname: string): Guide | undefined {
  return GUIDES[pathname]
}
