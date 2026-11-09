import { getInvitationById, loadInvitations } from './invitations.js';

const page = document.body.dataset.page;
const DATA_URL = '../Script/data/invitations.json';

function setField(name, value) {
  document.querySelectorAll(`[data-field="${name}"]`).forEach((element) => {
    element.textContent = value ?? '';
  });
}

function buildProgram(program) {
  const list = document.querySelector('[data-program-list]');
  list.replaceChildren();

  program.forEach((item, index) => {
    const row = document.createElement('li');
    row.className = 'program-item';

    const time = document.createElement('time');
    time.className = 'program-time';
    time.textContent = item.time;

    const marker = document.createElement('span');
    marker.className = 'program-marker';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = String(index + 1).padStart(2, '0');

    const details = document.createElement('div');
    details.className = 'program-details';
    const title = document.createElement('h3');
    title.textContent = item.title;
    const description = document.createElement('p');
    description.textContent = item.detail ?? '';
    details.append(title, description);
    row.append(time, marker, details);
    list.append(row);
  });
}

function renderInvitation(invitation) {
  ['guestOne', 'guestTwo', 'groom', 'bride', 'coupleDescription', 'venueName', 'venueDescription', 'weddingDate', 'weddingTime', 'table']
    .forEach((field) => setField(field, invitation[field]));

  const address = document.querySelector('[data-field="venueAddress"]');
  address.textContent = invitation.venueAddress;
  const mapLink = document.querySelector('[data-map-link]');
  if (invitation.mapAddress) {
    mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.mapAddress)}`;
    mapLink.hidden = false;
  }

  buildProgram(invitation.program ?? []);
  document.querySelector('[data-invitation-content]').hidden = false;
  document.title = `${invitation.groom} & ${invitation.bride} — INVITIA`;
  initializeReveals();
}

function createInvitationLink(invitation) {
  const link = document.createElement('a');
  link.className = 'invitation-card';
  link.href = `/HTML/invitation.html?id=${encodeURIComponent(invitation.id)}`;

  const eyebrow = document.createElement('span');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = invitation.weddingDate;
  const names = document.createElement('span');
  names.className = 'directory-couple';
  names.textContent = `${invitation.groom} & ${invitation.bride}`;
  const guests = document.createElement('span');
  guests.className = 'directory-guests';
  guests.textContent = `Pour ${invitation.guestOne} et ${invitation.guestTwo}`;
  const arrow = document.createElement('span');
  arrow.className = 'directory-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';

  link.append(eyebrow, names, guests, arrow);
  return link;
}

async function initializeIndex() {
  const list = document.querySelector('[data-invitation-list]');
  try {
    const invitations = await loadInvitations();
    list.replaceChildren(...invitations.map(createInvitationLink));
  } catch {
    list.innerHTML = '<p class="loading-message">Les invitations ne sont pas disponibles pour le moment.</p>';
  }
}

function initializeMusic() {
  const audio = document.querySelector('[data-music]');
  const button = document.querySelector('[data-music-toggle]');
  const label = document.querySelector('[data-music-label]');
  const volume = document.querySelector('[data-music-volume]');
  if (!audio || !button || !volume) return;

  const setPlaybackState = (isPlaying) => {
    button.setAttribute('aria-pressed', String(isPlaying));
    button.setAttribute('aria-label', isPlaying ? 'Désactiver la musique' : 'Activer la musique');
    label.textContent = isPlaying ? 'En lecture' : 'Musique';
  };

  audio.volume = Number(volume.value);
  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
    if (audio.volume === 0 && !audio.paused) {
      audio.pause();
      setPlaybackState(false);
    }
  });

  button.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        await audio.play();
        setPlaybackState(true);
      } catch {
        label.textContent = 'Musique indisponible';
      }
    } else {
      audio.pause();
      setPlaybackState(false);
    }
  });
}

function initializeReveals() {
  const targets = document.querySelectorAll('.reveal:not(.is-visible)');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach((target) => observer.observe(target));
}

function showInvitationError() {
  document.querySelector('[data-invitation-content]').hidden = true;
  document.querySelector('[data-invitation-error]').hidden = false;
}

async function initializeInvitation() {
  initializeMusic();
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    showInvitationError();
    return;
  }

  try {
    const invitations = await loadInvitations();
    const invitation = getInvitationById(invitations, id);
    if (!invitation) {
      showInvitationError();
      return;
    }
    renderInvitation(invitation);
  } catch {
    showInvitationError();
  }
}

if (page === 'index') initializeIndex();
if (page === 'invitation') initializeInvitation();