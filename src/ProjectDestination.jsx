import VengeancePage from './VengeancePage';
import WorkshopPage from './WorkshopPage';
import {routePath,sitePath} from './PublicPaths';
import './ProjectDestination.css';

// A single CosmicAtmosphere belongs to App; destination content sits above it.
export default function ProjectDestination({project,onBack}){
 const isVerlis=routePath(window.location.pathname)==='/projects/verlis'||
   (project?.index===1&&String(project?.title||'').toUpperCase()==='VERLIS');
 const isVengeance=routePath(window.location.pathname)==='/projects/vengeance'||project?.index===2;
 const isWorkshop=routePath(window.location.pathname)==='/projects/workshop-more-dimension'||
  routePath(window.location.pathname)==='/projects/workshop'||project?.index===3;
 if(isWorkshop)return <section className="project-destination project-destination--workshop"
  aria-label="MORE DIMENSION workshop">
  <WorkshopPage/>
  <button type="button" className="project-destination__back project-destination__back--workshop"
   onClick={onBack}>RETURN TO GALLERY</button>
 </section>;
 if(isVengeance)return <section className="project-destination project-destination--vengeance" aria-label="VENGEANCE film manifesto">
  <VengeancePage/>
  <button type="button" className="project-destination__back project-destination__back--vengeance" onClick={onBack}>RETURN TO GALLERY</button>
 </section>;
 if(isVerlis)return <section className="project-destination project-destination--verlis" aria-label="VERLIS case study">
  <iframe className="project-destination__case-study" title="VERLIS research case study" src={sitePath("/verlis/index.html?embedded=1")} />
  <button type="button" className="project-destination__back project-destination__back--verlis" onClick={onBack}>RETURN TO GALLERY</button>
 </section>;
 return <section className="project-destination" aria-label="Project destination">
  <button type="button" className="project-destination__back" onClick={onBack}>RETURN TO GALLERY</button>
  <p className="project-destination__eyebrow">VENSHALOR / PROJECT ARCHIVE</p>
  <h1>{project?.title||'PROJECT'}</h1>
  <p className="project-destination__status">PROJECT PAGE / IN PREPARATION</p>
  <p className="project-destination__note">The entry sequence is ready. This destination is reserved for the case study.</p>
 </section>;
}
