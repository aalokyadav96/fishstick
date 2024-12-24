import { displayProfile, displayUserProfile  } from "../../services/profile/userProfileService";

function UserProfile(contentContainer) {
    contentContainer.innerHTML = '';
    displayProfile(contentContainer);
}

export { UserProfile, displayUserProfile  };
