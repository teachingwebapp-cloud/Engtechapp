const crypto = require('crypto');

const generateRoomName = (classTitle) => {
  const slug = classTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);

  const randomId = crypto.randomBytes(4).toString('hex');
  return `eng-${slug}-${randomId}`;
};

// Jitsi configuration for different roles
const getJitsiConfig = (role, userName, roomName) => {
  const baseConfig = {
    roomName: roomName,
    width: '100%',
    height: '100%',
    parentNode: null,
    userInfo: {
      displayName: userName
    },
    configOverwrite: {
      prejoinPageEnabled: false, 
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      enableNoAudioDetection: true,
      enableNoVideoDetection: true,
      disableDeepLinking: true,
      enableClosePage: false,
      hideConferenceSubject: false,
      hideConferenceTimer: false,
      p2p: { enabled: true } // Better for smaller 1-on-1 sessions
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      SHOW_BRAND_WATERMARK: false,
      SHOW_POWERED_BY: false,
      TOOLBAR_BUTTONS: [],
    }
  };

  // Fix: was `role === 'admin' || role === 'admin'` (duplicate) — now just `role === 'admin'`
  if (role === 'admin') {
    // Teacher gets full controls
    baseConfig.configOverwrite.startWithAudioMuted = false;
    baseConfig.configOverwrite.startWithVideoMuted = false;
    baseConfig.interfaceConfigOverwrite.TOOLBAR_BUTTONS = [
      'microphone', 'camera', 'desktop', 'fullscreen',
      'raisehand', 'participants-pane', 'tileview',
      'videoquality', 'settings', 'hangup',
      'mute-everyone', 'security'
    ];
  } else {
    // Student gets heavily restricted controls - absolutely no access
    baseConfig.configOverwrite.startWithAudioMuted = true;
    baseConfig.configOverwrite.startWithVideoMuted = true;

    // Strict permissions locking down any ability to alter the call
    baseConfig.configOverwrite.disableModeratorIndicator = true;
    baseConfig.configOverwrite.disableRemoteMute = true;
    baseConfig.configOverwrite.remoteVideoMenu = {
        disableKick: true,
        disableGrantModerator: true
    };
    baseConfig.configOverwrite.participantsPane = {
        hideMoreActionsButton: true,
        hideMuteAllButton: true
    };

    // Strip ALL buttons from the interface toolbar so they cannot interact with settings
    baseConfig.interfaceConfigOverwrite.TOOLBAR_BUTTONS = [];
    baseConfig.interfaceConfigOverwrite.DISABLE_JOIN_LEAVE_NOTIFICATIONS = true;
  }

  return baseConfig;
};

module.exports = { generateRoomName, getJitsiConfig };
