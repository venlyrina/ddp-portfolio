import {sitePath} from './PublicPaths';
// Browser-exported media IDs mapped to the public static originals.
const mediaFiles={
  "000c05ee-d41c-4ae2-bfd2-e6e6f2157437": "63cde514-aafa-4bca-931a-c0c927409349.jpg",
  "0ad183e4-d3a3-4612-8c91-cd87b3f1c010": "Engine blueprint.png",
  "1f67d2b8-3135-444a-b8ac-3dc44f0d76ca": "combat.mp4",
  "421e837d-6ecf-4f8c-9797-cd72d9ec0923": "8d8cc2b9-9da2-4bec-9f36-235d0326791a.jpg",
  "61be7734-dae8-4424-95f5-af940cef87b9": "56517792-1ccb-4af9-83d3-956c42043bff.jpg",
  "68d73b18-5d73-4668-b608-788870e9ca5e": "red.mp4",
  "6f8a39e5-fca7-4d90-84c2-22c4171ab0f6": "c0e40e27-c535-45bf-b518-fec641aa6600.jpg",
  "71e1a3e9-0599-434c-8b19-b07d6aafc241": "58b5314d-ca0c-4ae1-9b9d-cee43fc7ccd8.jpg",
  "72cfca93-03d6-465e-8c87-eedd5919df47": "YTDown.com_YouTube_Media_oTdQx-meFLE_Eternal-Engine-concept-art-by-Ziesbeauz_001_1080p.mp4",
  "7e3646ee-6799-4747-abb1-b74b902f660f": "re.mp4",
  "84a74f52-21ae-44bd-a87a-b8aaa0bceb55": "Engine blueprint-2.png",
  "8f14504f-fcec-456b-b7e9-2bfd15dd36bf": "a6c815a4-22d0-4027-ac05-3f4581d0f181.jpg",
  "a58e62f7-aec7-4c79-aa56-6877b298bfdb": "key.png",
  "ad1e18c8-a347-4bac-b2c4-c02953622c29": "Engine blueprint-3.png",
  "b75c50dd-6374-440c-9efa-5803119303f8": "2924e821-b219-497b-97a2-c7d833b19058.jpg",
  "c2a8add1-ce47-4bce-b9d5-5ed0028c1bc6": "YTDown.com_YouTube_Media_SXz55vZPkwE_Eternal-Engine-Work-Animation_003_1080p.mp4",
  "e9bf168d-bd05-4d40-8ad9-a8163a671f9e": "0e6e5231-efc1-4cb1-8841-08071b84b8eb.jpg",
  "eeb91c4f-436f-492e-959c-8aeb0421e41c": "1949ed4b-8a59-4038-b106-86e130aee261.jpg"
};
export const publishedWorkshopMedia=id=>mediaFiles[id]?sitePath('/assets/media/'+encodeURIComponent(mediaFiles[id])):'';
