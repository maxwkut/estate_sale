import { PalmTree } from "@/components/PalmTree";
import { RoomCatalog } from "@/components/RoomCatalog";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader active="catalog" />
      <main>
        <section className="hero site-shell" aria-label="Estate Sale introduction">
          <PalmTree className="hero-palm" />
          <h1 className="hero-brand">Brownsville Estate Sale</h1>
          <p className="hero-tagline">Quality Furniture, Home Décor &amp; More!</p>
          <p className="hero-lead">
            Join us for a large estate sale featuring a great selection of
            quality furniture, home furnishings, kitchenware, and outdoor items.
            Everything must go!
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#catalog">
              Browse rooms
            </a>
          </div>
        </section>
        <section className="sale-details site-shell" aria-label="Sale details">
          <div>
            <h2 className="sale-details-heading">Featured items include:</h2>
            <ul className="sale-details-list">
              <li>Ethan Allen dining room furniture</li>
              <li>Electric leather recliners</li>
              <li>Bedroom sets, beds, and mattresses</li>
              <li>Tables, chairs, and accent furniture</li>
              <li>Large-screen TVs and electronics</li>
              <li>Kitchenware, dishes, pots, pans, and cooking utensils</li>
              <li>Washer and dryer</li>
              <li>Outdoor patio furniture, cushions, and gas fire pit</li>
              <li>Home décor, lamps, and household items</li>
            </ul>
            <p className="sale-details-note">
              All items are in good condition and priced to sell! Great
              opportunities to purchase quality furnishings at estate sale
              prices.
            </p>
          </div>
          <aside className="sale-details-card">
            <dl className="sale-details-facts">
              <div>
                <dt>Location</dt>
                <dd>Brownsville, Texas</dd>
              </div>
              <div>
                <dt>Sale Days</dt>
                <dd>Wednesday, Friday &amp; Saturday of Thanksgiving week</dd>
              </div>
              <div>
                <dt>Appointments &amp; early viewing</dt>
                <dd>
                  Message Max: <a href="sms:+13466001002">346-600-1002</a>
                </dd>
              </div>
            </dl>
            <p className="sale-details-cta">Come early for the best selection!</p>
          </aside>
        </section>
        <RoomCatalog />
      </main>
    </>
  );
}
