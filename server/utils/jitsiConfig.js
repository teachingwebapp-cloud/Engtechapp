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
      p2p: { enabled: true }
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      SHOW_BRAND_WATERMARK: false,
      SHOW_POWERED_BY: false,
      TOOLBAR_BUTTONS: [],
    }
  };

  if (role === 'admin') {
    // Admin/Teacher: set as moderator so Jitsi skips the "log-in to become moderator" prompt
    baseConfig.userInfo.moderator = true;
    baseConfig.configOverwrite.startWithAudioMuted = false;
    baseConfig.configOverwrite.startWithVideoMuted = false;
    // startAsModerator tells Jitsi to bypass the lobby/moderator login screen
    baseConfig.configOverwrite.startAsModerator = true;
    baseConfig.configOverwrite.lobby = { autoKnock: false, enableChat: false };
    baseConfig.interfaceConfigOverwrite.TOOLBAR_BUTTONS = [
      'microphone', 'camera', 'desktop', 'fullscreen',
      'raisehand', 'participants-pane', 'tileview',
      'videoquality', 'settings', 'hangup',
      'mute-everyone', 'security'
    ];
  } else {
    // Student: muted by default, but give basic controls
    baseConfig.configOverwrite.startWithAudioMuted = true;
    baseConfig.configOverwrite.startWithVideoMuted = true;
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
    // Give students basic controls so they can trigger permissions
    baseConfig.interfaceConfigOverwrite.TOOLBAR_BUTTONS = [
      'microphone', 'camera', 'desktop', 'raisehand', 'hangup', 'tileview', 'fullscreen'
    ];
    baseConfig.interfaceConfigOverwrite.DISABLE_JOIN_LEAVE_NOTIFICATIONS = true;
  }

  return baseConfig;
};

module.exports = { generateRoomName, getJitsiConfig };
