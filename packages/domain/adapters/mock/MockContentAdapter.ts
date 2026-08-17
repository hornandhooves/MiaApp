/**
 * Contenido del demo directo del seed. La versión de producción lee
 * content/* de Firestore con el mismo contrato.
 */
import {
  admissions,
  blogPosts,
  contact,
  dayEvents,
  discover,
  experiences,
  kitchen,
  lineup,
  sunsetSet,
  week,
} from "../../../../seed/data/content";
import type {
  ContactData,
  ContentPort,
  LineupData,
} from "../../ports/ContentPort";

export class MockContentAdapter implements ContentPort {
  async kitchen() {
    return kitchen;
  }
  async admissions() {
    return admissions;
  }
  async lineup(): Promise<LineupData> {
    return { today: lineup, week, sunsetSet };
  }
  async experiences() {
    return experiences;
  }
  async journal() {
    return blogPosts;
  }
  async contact(): Promise<ContactData> {
    return contact;
  }
  async dayEvents() {
    return dayEvents;
  }
  async discover() {
    return discover;
  }
}
