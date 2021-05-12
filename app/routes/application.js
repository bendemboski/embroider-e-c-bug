import Route from '@ember/routing/route';
import { task } from 'ember-concurrency';

export default class ApplicationRoute extends Route {
  async model() {
    await this.doThing.perform();
  }

  @task
  *doThing() {
    yield new Promise((resolve) => setTimeout(resolve, 100));
  }
}
