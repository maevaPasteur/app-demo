import type { ComponentType } from 'react';
import Onboarding from './Onboarding';
import Feed from './Feed';
import VideoOpen from './VideoOpen';
import Worlds from './Worlds';
import World from './World';
import Podium from './Podium';
import Awards from './Awards';
import ProfileCreator from './ProfileCreator';
import ProfileFan from './ProfileFan';
import CreatorPublic from './CreatorPublic';
import FanPublic from './FanPublic';
import CreateDare from './CreateDare';
import CreateDuel from './CreateDuel';
import CreateDrop from './CreateDrop';
import JokerFan from './JokerFan';
import JokerFanFinished from './JokerFanFinished';
import JokerCreator from './JokerCreator';
import JokerInvitations from './JokerInvitations';
import Messages from './Messages';
import Message from './Message';
import EditProfile from './EditProfile';
import Identity from './Identity';
import PayoutSetup from './PayoutSetup';
import Watch from './Watch';
import Stories from './Stories';

// Imports statiques : bundle léger, navigation instantanée sans flash de chargement.
export const routeComponents: Record<string, ComponentType> = {
  '/welcome': Onboarding,
  '/': Feed,
  '/video/:id': VideoOpen,
  '/worlds': Worlds,
  '/world/:id': World,
  '/podium': Podium,
  '/awards': Awards,
  '/awards/all-time': Awards,
  '/me/creator': ProfileCreator,
  '/me/creator/payout': ProfileCreator,
  '/me/fan': ProfileFan,
  '/creator/:handle': CreatorPublic,
  '/fan/:handle': FanPublic,
  '/create/dare': CreateDare,
  '/create/duel': CreateDuel,
  '/create/drop': CreateDrop,
  '/joker': JokerFan,
  '/joker/finished': JokerFanFinished,
  '/joker/creator': JokerCreator,
  '/joker/invitations': JokerInvitations,
  '/messages': Messages,
  '/messages/requests': Messages,
  '/messages/:id': Message,
  '/messages/:id/respond': Message,
  '/settings/profile/:state': EditProfile,
  '/settings/identity': Identity,
  '/me/payout': PayoutSetup,
  '/watch/:id': Watch,
  '/stories/:id': Stories,
};
