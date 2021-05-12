// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "oE": () => (/* reexport */ task_properties_task)
});

// UNUSED EXPORTS: Task, TaskGroup, TaskGroupProperty, TaskInstance, TaskProperty, all, allSettled, animationFrame, didCancel, dropTask, dropTaskGroup, enqueueTask, enqueueTaskGroup, forever, hash, hashSettled, keepLatestTask, keepLatestTaskGroup, lastValue, race, rawTimeout, restartableTask, restartableTaskGroup, taskGroup, timeout, waitForEvent, waitForProperty, waitForQueue

;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/environment.js
class Environment {
  assert() {}

  async() {}

  reportUncaughtRejection() {}

  defer() {}

  globalDebuggingEnabled() {}

}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/ember-environment.js

class EmberEnvironment extends Environment {
  assert(...args) {
    ( false && 0);
  }

  async(callback) {
    Ember.run.join(() => Ember.run.once(null, callback));
  }

  reportUncaughtRejection(error) {
    Ember.run.next(null, function () {
      if (Ember.onerror) {
        Ember.onerror(error);
      } else {
        throw error;
      }
    });
  }

  defer() {
    return Ember.RSVP.defer();
  }

  globalDebuggingEnabled() {
    return Ember.ENV.DEBUG_TASKS;
  }

}
const ember_environment_EMBER_ENVIRONMENT = new EmberEnvironment();
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/yieldables.js
const yieldables_cancelableSymbol = "__ec_cancel__";
const yieldables_yieldableSymbol = "__ec_yieldable__";
const yieldables_YIELDABLE_CONTINUE = "next";
const yieldables_YIELDABLE_THROW = "throw";
const YIELDABLE_RETURN = "return";
const YIELDABLE_CANCEL = "cancel";
class yieldables_Yieldable {
  constructor() {
    this[yieldables_yieldableSymbol] = this[yieldables_yieldableSymbol].bind(this);
    this[yieldables_cancelableSymbol] = this[yieldables_cancelableSymbol].bind(this);
  }

  _deferable() {
    let def = {
      resolve: undefined,
      reject: undefined
    };
    def.promise = new Promise((resolve, reject) => {
      def.resolve = resolve;
      def.reject = reject;
    });
    return def;
  }

  _toPromise() {
    let def = this._deferable();

    let thinInstance = {
      proceed(_index, resumeType, value) {
        if (resumeType == yieldables_YIELDABLE_CONTINUE || resumeType == YIELDABLE_RETURN) {
          def.resolve(value);
        } else {
          def.reject(value);
        }
      }

    };
    let maybeDisposer = this[yieldables_yieldableSymbol](thinInstance, 0);
    def.promise[yieldables_cancelableSymbol] = maybeDisposer || this[yieldables_cancelableSymbol];
    return def.promise;
  }

  then(...args) {
    return this._toPromise().then(...args);
  }

  catch(...args) {
    return this._toPromise().catch(...args);
  }

  finally(...args) {
    return this._toPromise().finally(...args);
  }

  [yieldables_yieldableSymbol]() {}

  [yieldables_cancelableSymbol]() {}

}

class AnimationFrameYieldable extends (/* unused pure expression or super */ null && (yieldables_Yieldable)) {
  constructor() {
    super();
    this.timerId = null;
  }

  [yieldables_yieldableSymbol](taskInstance, resumeIndex) {
    this.timerId = requestAnimationFrame(() => {
      taskInstance.proceed(resumeIndex, yieldables_YIELDABLE_CONTINUE, taskInstance._result);
    });
  }

  [yieldables_cancelableSymbol]() {
    cancelAnimationFrame(this.timerId);
    this.timerId = null;
  }

}

class ForeverYieldable extends yieldables_Yieldable {
  [yieldables_yieldableSymbol]() {}

  [yieldables_cancelableSymbol]() {}

}

class RawTimeoutYieldable extends (/* unused pure expression or super */ null && (yieldables_Yieldable)) {
  constructor(ms) {
    super();
    this.ms = ms;
    this.timerId = null;
  }

  [yieldables_yieldableSymbol](taskInstance, resumeIndex) {
    this.timerId = setTimeout(() => {
      taskInstance.proceed(resumeIndex, yieldables_YIELDABLE_CONTINUE, taskInstance._result);
    }, this.ms);
  }

  [yieldables_cancelableSymbol]() {
    clearTimeout(this.timerId);
    this.timerId = null;
  }

}
/**
 * Yielding `animationFrame()` will pause a task until after the next animation
 * frame using the native `requestAnimationFrame()` browser API.
 *
 * The task below, when performed, will print the time since the last loop run
 * for every animation frame.
 *
 * ```js
 * export default class MyComponent extends Component {
 *   @task *myTask() {
 *     let lastNow = performance.now();
 *     while (true) {
 *       yield animationFrame();
 *
 *       let now = performance.now();
 *       let dt = now - lastNow;
 *       lastNow = now;
 *
 *       console.log(dt);
 *     }
 *   }
 * }
 * ```
 */


function animationFrame() {
  return new AnimationFrameYieldable();
}
/**
 *
 * Yielding `forever` will pause a task indefinitely until
 * it is cancelled (i.e. via host object destruction, the restartable modifier,
 * or manual cancellation).
 *
 * This is often useful in cases involving animation: if you're
 * using Liquid Fire, or some other animation scheme, sometimes you'll
 * notice buttons visibly reverting to their inactive states during
 * a route transition. By yielding `forever` in a Component task that drives a
 * button's active state, you can keep a task indefinitely running
 * until the animation runs to completion.
 *
 * NOTE: Liquid Fire also includes a useful `waitUntilIdle()` method
 * on the `liquid-fire-transitions` service that you can use in a lot
 * of these cases, but it won't cover cases of asynchrony that are
 * unrelated to animation, in which case `forever` might be better suited
 * to your needs.
 *
 * ```js
 * import { task, forever } from 'ember-concurrency';
 * export default class MyComponent extends Component {
 *   @service myService;
 *   @task *myTask() {
 *     yield this.myService.doSomethingThatCausesATransition();
 *     yield forever;
 *   }
 * }
 * ```
 */

const forever = new ForeverYieldable();
/**
 *
 * Yielding `rawTimeout(ms)` will pause a task for the duration
 * of time passed in, in milliseconds.
 *
 * The timeout will use the native `setTimeout()` browser API,
 * instead of the Ember runloop, which means that test helpers
 * will *not* wait for it to complete.
 *
 * The task below, when performed, will print a message to the
 * console every second.
 *
 * ```js
 * export default class MyComponent extends Component {
 *   @task *myTask() {
 *     while (true) {
 *       console.log("Hello!");
 *       yield rawTimeout(1000);
 *     }
 *   }
 * }
 * ```
 *
 * @param {number} ms - the amount of time to sleep before resuming
 *   the task, in milliseconds
 */

function rawTimeout(ms) {
  return new RawTimeoutYieldable(ms);
}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/utils.js


const USE_TRACKED = true;
const assignProperties = USE_TRACKED ? Object.assign : Ember.setProperties;
function isEventedObject(c) {
  return c && (typeof c.one === 'function' && typeof c.off === 'function' || typeof c.on === 'function' && typeof c.off === 'function' || typeof c.addEventListener === 'function' && typeof c.removeEventListener === 'function');
}
class utils_EmberYieldable extends (/* unused pure expression or super */ null && (Yieldable)) {
  _deferable() {
    return EMBER_ENVIRONMENT.defer();
  }

}

class TimeoutYieldable extends (/* unused pure expression or super */ null && (utils_EmberYieldable)) {
  constructor(ms) {
    super();
    this.ms = ms;
    this.timerId = null;
  }

  [yieldableSymbol](taskInstance, resumeIndex) {
    this.timerId = Ember.run.later(() => {
      taskInstance.proceed(resumeIndex, YIELDABLE_CONTINUE, taskInstance._result);
    }, this.ms);
  }

  [cancelableSymbol]() {
    Ember.run.cancel(this.timerId);
    this.timerId = null;
  }

}
/**
 *
 * Yielding `timeout(ms)` will pause a task for the duration
 * of time passed in, in milliseconds.
 *
 * This timeout will be scheduled on the Ember runloop, which
 * means that test helpers will wait for it to complete before
 * continuing with the test. See `rawTimeout()` if you need
 * different behavior.
 *
 * The task below, when performed, will print a message to the
 * console every second.
 *
 * ```js
 * export default class MyComponent extends Component {
 *   @task *myTask() {
 *     while (true) {
 *       console.log("Hello!");
 *       yield timeout(1000);
 *     }
 *   }
 * }
 * ```
 *
 * @param {number} ms - the amount of time to sleep before resuming
 *   the task, in milliseconds
 */


function timeout(ms) {
  return new TimeoutYieldable(ms);
}
function deprecatePrivateModule(moduleName) {
  // eslint-disable-next-line no-console
  console.warn(`an Ember addon is importing a private ember-concurrency module '${moduleName}' that has moved`);
}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/policies/bounded-policy.js
class BoundedPolicy {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency || 1;
  }

}

/* harmony default export */ const bounded_policy = (BoundedPolicy);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/policies/execution-states.js
const TYPE_CANCELLED = "CANCELLED";
const TYPE_STARTED = "STARTED";
const TYPE_QUEUED = "QUEUED";
const STARTED = {
  type: TYPE_STARTED
};
const QUEUED = {
  type: TYPE_QUEUED
};
const makeCancelState = reason => ({
  type: TYPE_CANCELLED,
  reason
});
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/policies/enqueued-policy.js



class EnqueuedReducer {
  constructor(remainingSlots) {
    this.remainingSlots = remainingSlots;
  }

  step() {
    if (this.remainingSlots > 0) {
      this.remainingSlots--;
      return STARTED;
    } else {
      return QUEUED;
    }
  }

}

class EnqueuedPolicy extends bounded_policy {
  makeReducer() {
    return new EnqueuedReducer(this.maxConcurrency);
  }

}

/* harmony default export */ const enqueued_policy = (EnqueuedPolicy);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/policies/drop-policy.js


const CANCELLED = makeCancelState(`it belongs to a 'drop' Task that was already running`);

class DropReducer {
  constructor(remainingSlots) {
    this.remainingSlots = remainingSlots;
  }

  step() {
    if (this.remainingSlots > 0) {
      this.remainingSlots--;
      return STARTED;
    }

    return CANCELLED;
  }

}

class DropPolicy extends bounded_policy {
  makeReducer() {
    return new DropReducer(this.maxConcurrency);
  }

}

/* harmony default export */ const drop_policy = (DropPolicy);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/policies/keep-latest-policy.js


const keep_latest_policy_CANCELLED = makeCancelState(`it belongs to a 'keepLatest' Task that was already running`); // Given:
// - started tasks: [a,b,_]
// - queued tasks:  [c,d,e,f]
// KeepLatest will cancel all but the last queued task instance, producing:
// - started tasks: [a,b,c]
// - queued tasks: [f]
// TODO: perhaps we should expose another config for the number to keep enqueued.
//       this would also make sense for enqueued, e.g. perform a max of maxConcurrency
//       concurrent task instances, but after a number of queued instances has been
//       reached, they should be cancelled.

class KeepLatestReducer {
  constructor(remainingSlots, numToCancel) {
    this.remainingSlots = remainingSlots;
    this.numToCancel = numToCancel;
  }

  step() {
    if (this.remainingSlots > 0) {
      this.remainingSlots--;
      return STARTED;
    } else {
      if (this.numToCancel > 0) {
        this.numToCancel--;
        return keep_latest_policy_CANCELLED;
      } else {
        return QUEUED;
      }
    }
  }

}

class KeepLatestPolicy extends bounded_policy {
  makeReducer(numRunning, numQueued) {
    let maxEnqueued = 1;
    let totalRunning = numRunning + numQueued;
    return new KeepLatestReducer(this.maxConcurrency, totalRunning - this.maxConcurrency - maxEnqueued);
  }

}

/* harmony default export */ const keep_latest_policy = (KeepLatestPolicy);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/policies/restartable-policy.js


const restartable_policy_CANCELLED = makeCancelState(`it belongs to a 'restartable' Task that was .perform()ed again`);

class RestartableReducer {
  constructor(numToCancel) {
    this.numToCancel = numToCancel;
  }

  step() {
    if (this.numToCancel > 0) {
      this.numToCancel--;
      return restartable_policy_CANCELLED;
    } else {
      return STARTED;
    }
  }

}

class RestartablePolicy extends bounded_policy {
  makeReducer(numRunning, numQueued) {
    return new RestartableReducer(numRunning + numQueued - this.maxConcurrency);
  }

}

/* harmony default export */ const restartable_policy = (RestartablePolicy);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/policies/unbounded-policy.js


class UnboundedReducer {
  step() {
    return STARTED;
  }

}

const SINGLETON_REDUCER = new UnboundedReducer();

class UnboundedPolicy {
  makeReducer() {
    return SINGLETON_REDUCER;
  }

}

/* harmony default export */ const unbounded_policy = (UnboundedPolicy);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/task/default-state.js
const DEFAULT_STATE = {
  last: null,
  lastRunning: null,
  lastStarted: null,
  lastPerformed: null,
  lastSuccessful: null,
  lastComplete: null,
  lastErrored: null,
  lastCanceled: null,
  lastIncomplete: null,
  performCount: 0
};
Object.freeze(DEFAULT_STATE);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/task-instance/cancelation.js
const TASK_CANCELATION_NAME = "TaskCancelation";
/**
 * Returns true if the object passed to it is a TaskCancelation error.
 * If you call `someTask.perform().catch(...)` or otherwise treat
 * a {@linkcode TaskInstance} like a promise, you may need to
 * handle the cancelation of a TaskInstance differently from
 * other kinds of errors it might throw, and you can use this
 * convenience function to distinguish cancelation from errors.
 *
 * ```js
 * click() {
 *   this.myTask.perform().catch(e => {
 *     if (!didCancel(e)) { throw e; }
 *   });
 * }
 * ```
 *
 * @param {Object} error the caught error, which might be a TaskCancelation
 * @returns {Boolean}
 */

function didCancel(e) {
  return e && e.name === TASK_CANCELATION_NAME;
}
const CANCEL_KIND_EXPLICIT = "explicit";
const CANCEL_KIND_YIELDABLE_CANCEL = "yielded";
const CANCEL_KIND_LIFESPAN_END = "lifespan_end";
const CANCEL_KIND_PARENT_CANCEL = "parent_cancel";
class CancelRequest {
  constructor(kind, reason) {
    this.kind = kind;
    this.reason = reason;
    this.promise = new Promise(resolve => {
      this.finalize = resolve;
    });
  }

}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/task/taskable.js


let guidId = 0;

function makeGuid() {
  return `ec_${guidId++}`;
}

class Taskable {
  constructor(options) {
    this.options = options;
    Object.assign(this, options);
    this.guid = makeGuid();
    this.guids = {};
    this.guids[this.guid] = true;

    if (this.group) {
      Object.assign(this.guids, this.group.guids);
    }
  }

  cancelAll(options) {
    let {
      reason,
      cancelRequestKind,
      resetState
    } = options || {};
    reason = reason || ".cancelAll() was explicitly called on the Task";
    let cancelRequest = new CancelRequest(cancelRequestKind || CANCEL_KIND_EXPLICIT, reason);
    return this.scheduler.cancelAll(this.guid, cancelRequest).then(() => {
      if (resetState) {
        this._resetState();
      }
    });
  }

  _resetState() {
    this.setState(DEFAULT_STATE);
  } // override


  setState() {}

}
Object.assign(Taskable.prototype, DEFAULT_STATE);
Object.assign(Taskable.prototype, {
  numRunning: 0,
  numQueued: 0,
  isRunning: false,
  isQueued: false,
  isIdle: true,
  state: 'idle'
});
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/generator-state.js
class GeneratorStepResult {
  constructor(value, done, errored) {
    this.value = value;
    this.done = done;
    this.errored = errored;
  }

}
class GeneratorState {
  constructor(generatorFactory) {
    this.done = false;
    this.generatorFactory = generatorFactory;
    this.iterator = null;
  }

  step(resolvedValue, iteratorMethod) {
    try {
      let iterator = this.getIterator();
      let {
        value,
        done
      } = iterator[iteratorMethod](resolvedValue);

      if (done) {
        return this.finalize(value, false);
      } else {
        return new GeneratorStepResult(value, false, false);
      }
    } catch (e) {
      return this.finalize(e, true);
    }
  }

  getIterator() {
    if (!this.iterator && !this.done) {
      this.iterator = this.generatorFactory();
    }

    return this.iterator;
  }

  finalize(value, errored) {
    this.done = true;
    this.iterator = null;
    return new GeneratorStepResult(value, true, errored);
  }

}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/task-instance/completion-states.js
const COMPLETION_PENDING = 0;
const COMPLETION_SUCCESS = 1;
const COMPLETION_ERROR = 2;
const COMPLETION_CANCEL = 3;
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/task-instance/initial-state.js

const INITIAL_STATE = {
  completionState: COMPLETION_PENDING,

  /**
   * If this TaskInstance runs to completion by returning a property
   * other than a rejecting promise, this property will be set
   * with that value.
   *
   * @memberof TaskInstance
   * @instance
   * @readOnly
   */
  value: null,

  /**
   * If this TaskInstance is canceled or throws an error (or yields
   * a promise that rejects), this property will be set with that error.
   * Otherwise, it is null.
   *
   * @memberof TaskInstance
   * @instance
   * @readOnly
   */
  error: null,

  /**
   * True if the task instance is fulfilled.
   *
   * @memberof TaskInstance
   * @instance
   * @readOnly
   */
  isSuccessful: false,

  /**
   * True if the task instance resolves to a rejection.
   *
   * @memberof TaskInstance
   * @instance
   * @readOnly
   */
  isError: false,

  /**
   * True if the task instance is canceled
   *
   * @memberof TaskInstance
   * @instance
   * @readOnly
   */
  isCanceled: false,

  /**
   * True if the task instance has started, else false.
   *
   * @memberof TaskInstance
   * @instance
   * @readOnly
   */
  hasStarted: false,

  /**
   * True if the task has run to completion.
   *
   * @memberof TaskInstance
   * @instance
   * @readOnly
   */
  isFinished: false
};
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/task-instance/executor.js





const PERFORM_TYPE_DEFAULT = "PERFORM_TYPE_DEFAULT";
const PERFORM_TYPE_UNLINKED = "PERFORM_TYPE_UNLINKED";
const PERFORM_TYPE_LINKED = "PERFORM_TYPE_LINKED";
const CANCEL_RETURN_VALUE_SENTINEL = {};
let TASK_INSTANCE_STACK = [];
function getRunningInstance() {
  return TASK_INSTANCE_STACK[TASK_INSTANCE_STACK.length - 1];
}
class TaskInstanceExecutor {
  constructor({
    generatorFactory,
    env,
    debug
  }) {
    this.generatorState = new GeneratorState(generatorFactory);
    this.state = Object.assign({}, INITIAL_STATE);
    this.index = 1;
    this.disposers = [];
    this.finalizeCallbacks = [];
    this.env = env;
    this.debug = debug;
    this.cancelRequest = null;
  }

  start() {
    if (this.state.hasStarted || this.cancelRequest) {
      return;
    }

    this.setState({
      hasStarted: true
    });
    this.proceedSync(yieldables_YIELDABLE_CONTINUE, undefined);
    this.taskInstance.onStarted();
  }

  cancel(cancelRequest) {
    if (!this.requestCancel(cancelRequest)) {
      cancelRequest.finalize();
      return cancelRequest.promise;
    }

    if (this.state.hasStarted) {
      this.proceedWithCancelAsync();
    } else {
      this.finalizeWithCancel();
    }

    return this.cancelRequest.promise;
  }

  setState(state) {
    Object.assign(this.state, state);
    this.taskInstance.setState(this.state);
  }

  proceedChecked(index, yieldResumeType, value) {
    if (this.state.isFinished) {
      return;
    }

    if (!this.advanceIndex(index)) {
      return;
    }

    if (yieldResumeType === YIELDABLE_CANCEL) {
      this.requestCancel(new CancelRequest(CANCEL_KIND_YIELDABLE_CANCEL), value);
      this.proceedWithCancelAsync();
    } else {
      this.proceedAsync(yieldResumeType, value);
    }
  }

  proceedWithCancelAsync() {
    this.proceedAsync(YIELDABLE_RETURN, CANCEL_RETURN_VALUE_SENTINEL);
  }

  proceedAsync(yieldResumeType, value) {
    this.advanceIndex(this.index);
    this.env.async(() => this.proceedSync(yieldResumeType, value));
  }

  proceedSync(yieldResumeType, value) {
    if (this.state.isFinished) {
      return;
    }

    this.dispose();

    if (this.generatorState.done) {
      this.handleResolvedReturnedValue(yieldResumeType, value);
    } else {
      this.handleResolvedContinueValue(yieldResumeType, value);
    }
  }
  /**
   * This method is called when a previously yielded value from
   * the generator has been resolved, and now it's time to pass
   * it back into the generator. There are 3 ways to "resume" a
   * generator:
   *
   * - call `.next(value)` on it, which is used to pass in a resolved
   *   value (the fulfilled value of a promise), e.g. if a task generator fn
   *   does `yield Promise.resolve(5)`, then we take that promise yielded
   *   by the generator, detect that it's a promise, resolve it, and then
   *   pass its fulfilled value `5` back into the generator function so
   *   that it can continue executing.
   * - call `.throw(error)` on it, which throw an exception from where the
   *   the generator previously yielded. We do this when the previously
   *   yielded value resolves to an error value (e.g. a rejected promise
   *   or a TaskInstance that finished with an error). Note that when you
   *   resume a generator with a `.throw()`, it can still recover from that
   *   thrown error and continue executing normally so long as the `yield`
   *   was inside a `try/catch` statement.
   * - call `.return(value)` on it, causes the generator function to return
   *   from where it previously `yield`ed. We use `.return()` when cancelling
   *   a TaskInstance; by `.return`ing, rather than `.throw`ing, it allows
   *   the generator function to skip `catch(e) {}` blocks, which is usually
   *   reserved for actual errors/exceptions; if we `.throw`'d cancellations,
   *   it would require all tasks that used try/catch to conditionally ignore
   *   cancellations, which is annoying. So we `.return()` from generator functions
   *   in the case of errors as a matter of convenience.
   *
   * @private
   */


  handleResolvedContinueValue(iteratorMethod, resumeValue) {
    let beforeIndex = this.index;
    let stepResult = this.generatorStep(resumeValue, iteratorMethod); // TODO: what is this doing? write breaking test.

    if (!this.advanceIndex(beforeIndex)) {
      return;
    }

    if (stepResult.errored) {
      this.finalize(stepResult.value, COMPLETION_ERROR);
      return;
    }

    this.handleYieldedValue(stepResult);
  }
  /**
   * This method is called when the generator function is all
   * out of values, and the last value returned from the function
   * (possible a thenable/yieldable/promise/etc) has been resolved.
   *
   * Possible cases:
   * - `return "simple value";` // resolved value is "simple value"
   * - `return undefined;` // (or omitted return) resolved value is undefined
   * - `return someTask.perform()` // resolved value is the value returned/resolved from someTask
   *
   * @private
   */


  handleResolvedReturnedValue(yieldResumeType, value) {
    switch (yieldResumeType) {
      case yieldables_YIELDABLE_CONTINUE:
      case YIELDABLE_RETURN:
        this.finalize(value, COMPLETION_SUCCESS);
        break;

      case yieldables_YIELDABLE_THROW:
        this.finalize(value, COMPLETION_ERROR);
        break;
    }
  }

  handleYieldedUnknownThenable(thenable) {
    let resumeIndex = this.index;
    thenable.then(value => {
      this.proceedChecked(resumeIndex, yieldables_YIELDABLE_CONTINUE, value);
    }, error => {
      this.proceedChecked(resumeIndex, yieldables_YIELDABLE_THROW, error);
    });
  }
  /**
   * The TaskInstance internally tracks an index/sequence number
   * (the `index` property) which gets incremented every time the
   * task generator function iterator takes a step. When a task
   * function is paused at a `yield`, there are two events that
   * cause the TaskInstance to take a step: 1) the yielded value
   * "resolves", thus resuming the TaskInstance's execution, or
   * 2) the TaskInstance is canceled. We need some mechanism to prevent
   * stale yielded value resolutions from resuming the TaskFunction
   * after the TaskInstance has already moved on (either because
   * the TaskInstance has since been canceled or because an
   * implementation of the Yieldable API tried to resume the
   * TaskInstance more than once). The `index` serves as
   * that simple mechanism: anyone resuming a TaskInstance
   * needs to pass in the `index` they were provided that acts
   * as a ticket to resume the TaskInstance that expires once
   * the TaskInstance has moved on.
   *
   * @private
   */


  advanceIndex(index) {
    if (this.index === index) {
      return ++this.index;
    }
  }

  handleYieldedValue(stepResult) {
    let yieldedValue = stepResult.value;

    if (!yieldedValue) {
      this.proceedWithSimpleValue(yieldedValue);
      return;
    }

    this.addDisposer(yieldedValue[yieldables_cancelableSymbol]);

    if (yieldedValue[yieldables_yieldableSymbol]) {
      this.invokeYieldable(yieldedValue);
    } else if (typeof yieldedValue.then === "function") {
      this.handleYieldedUnknownThenable(yieldedValue);
    } else {
      this.proceedWithSimpleValue(yieldedValue);
    }
  }

  proceedWithSimpleValue(yieldedValue) {
    this.proceedAsync(yieldables_YIELDABLE_CONTINUE, yieldedValue);
  }

  addDisposer(maybeDisposer) {
    if (typeof maybeDisposer !== "function") {
      return;
    }

    this.disposers.push(maybeDisposer);
  }
  /**
   * Runs any disposers attached to the task's most recent `yield`.
   * For instance, when a task yields a TaskInstance, it registers that
   * child TaskInstance's disposer, so that if the parent task is canceled,
   * dispose() will run that disposer and cancel the child TaskInstance.
   *
   * @private
   */


  dispose() {
    let disposers = this.disposers;

    if (disposers.length === 0) {
      return;
    }

    this.disposers = [];
    disposers.forEach(disposer => disposer());
  }
  /**
   * Calls .next()/.throw()/.return() on the task's generator function iterator,
   * essentially taking a single step of execution on the task function.
   *
   * @private
   */


  generatorStep(nextValue, iteratorMethod) {
    TASK_INSTANCE_STACK.push(this);
    let stepResult = this.generatorState.step(nextValue, iteratorMethod);
    TASK_INSTANCE_STACK.pop(); // TODO: fix this!

    if (this._expectsLinkedYield) {
      let value = stepResult.value;

      if (!value || value.performType !== PERFORM_TYPE_LINKED) {
        // eslint-disable-next-line no-console
        console.warn("You performed a .linked() task without immediately yielding/returning it. This is currently unsupported (but might be supported in future version of ember-concurrency).");
      }

      this._expectsLinkedYield = false;
    }

    return stepResult;
  }

  maybeResolveDefer() {
    if (!this.defer || !this.state.isFinished) {
      return;
    }

    if (this.state.completionState === COMPLETION_SUCCESS) {
      this.defer.resolve(this.state.value);
    } else {
      this.defer.reject(this.state.error);
    }
  }

  onFinalize(callback) {
    this.finalizeCallbacks.push(callback);

    if (this.state.isFinished) {
      this.runFinalizeCallbacks();
    }
  }

  runFinalizeCallbacks() {
    this.finalizeCallbacks.forEach(cb => cb());
    this.finalizeCallbacks = [];
    this.maybeResolveDefer();
    this.maybeThrowUnhandledTaskErrorLater();
  }

  promise() {
    if (!this.defer) {
      this.defer = this.env.defer();
      this.asyncErrorsHandled = true;
      this.maybeResolveDefer();
    }

    return this.defer.promise;
  }

  maybeThrowUnhandledTaskErrorLater() {
    if (!this.asyncErrorsHandled && this.state.completionState === COMPLETION_ERROR && !didCancel(this.state.error)) {
      this.env.async(() => {
        if (!this.asyncErrorsHandled) {
          this.env.reportUncaughtRejection(this.state.error);
        }
      });
    }
  }

  requestCancel(request) {
    if (this.cancelRequest || this.state.isFinished) {
      return false;
    }

    this.cancelRequest = request;
    return true;
  }

  finalize(value, completionState) {
    if (this.cancelRequest) {
      return this.finalizeWithCancel();
    }

    let state = {
      completionState
    };

    if (completionState === COMPLETION_SUCCESS) {
      state.isSuccessful = true;
      state.value = value;
    } else if (completionState === COMPLETION_ERROR) {
      state.isError = true;
      state.error = value;
    } else if (completionState === COMPLETION_CANCEL) {
      state.error = value;
    }

    this.finalizeShared(state);
  }

  finalizeWithCancel() {
    let cancelReason = this.taskInstance.formatCancelReason(this.cancelRequest.reason);
    let error = new Error(cancelReason);

    if (this.debugEnabled()) {
      // eslint-disable-next-line no-console
      console.log(cancelReason);
    }

    error.name = TASK_CANCELATION_NAME;
    this.finalizeShared({
      isCanceled: true,
      completionState: COMPLETION_CANCEL,
      error,
      cancelReason
    });
    this.cancelRequest.finalize();
  }

  debugEnabled() {
    return this.debug || this.env.globalDebuggingEnabled();
  }

  finalizeShared(state) {
    this.index++;
    state.isFinished = true;
    this.setState(state);
    this.runFinalizeCallbacks();
    this.dispatchFinalizeEvents(state.completionState);
  }

  dispatchFinalizeEvents(completionState) {
    switch (completionState) {
      case COMPLETION_SUCCESS:
        this.taskInstance.onSuccess();
        break;

      case COMPLETION_ERROR:
        this.taskInstance.onError(this.state.error);
        break;

      case COMPLETION_CANCEL:
        this.taskInstance.onCancel(this.state.cancelReason);
        break;
    }
  }

  invokeYieldable(yieldedValue) {
    try {
      let maybeDisposer = yieldedValue[yieldables_yieldableSymbol](this.taskInstance, this.index);
      this.addDisposer(maybeDisposer);
    } catch (e) {
      this.env.reportUncaughtRejection(e);
    }
  }
  /**
   * `onYielded` is called when this task instance has been
   * yielded in another task instance's execution. We take
   * this opportunity to conditionally link up the tasks
   * so that when the parent or child cancels, the other
   * is cancelled.
   *
   * Given the following case:
   *
   * ```js
   * parentTask: task(function * () {
   *   yield otherTask.perform();
   * })
   * ```
   *
   * Then the `parent` param is the task instance that is executing, `this`
   * is the `otherTask` task instance that was yielded.
   *
   * @private
   */


  onYielded(parent, resumeIndex) {
    this.asyncErrorsHandled = true;
    this.onFinalize(() => {
      let completionState = this.state.completionState;

      if (completionState === COMPLETION_SUCCESS) {
        parent.proceed(resumeIndex, yieldables_YIELDABLE_CONTINUE, this.state.value);
      } else if (completionState === COMPLETION_ERROR) {
        parent.proceed(resumeIndex, yieldables_YIELDABLE_THROW, this.state.error);
      } else if (completionState === COMPLETION_CANCEL) {
        parent.proceed(resumeIndex, YIELDABLE_CANCEL, null);
      }
    });
    let performType = this.getPerformType();

    if (performType === PERFORM_TYPE_UNLINKED) {
      return;
    }

    return () => {
      this.detectSelfCancelLoop(performType, parent);
      this.cancel(new CancelRequest(CANCEL_KIND_PARENT_CANCEL));
    };
  }

  getPerformType() {
    return this.taskInstance.performType || PERFORM_TYPE_DEFAULT;
  }

  detectSelfCancelLoop(performType, parent) {
    if (performType !== PERFORM_TYPE_DEFAULT) {
      return;
    }

    let parentCancelRequest = parent.executor && parent.executor.cancelRequest; // Detect that the parent was cancelled by a lifespan ending and
    // that the child is still running and not cancelled.

    if (parentCancelRequest && parentCancelRequest.kind === CANCEL_KIND_LIFESPAN_END && !this.cancelRequest && !this.state.isFinished) {
      this.taskInstance.selfCancelLoopWarning(parent);
    }
  }

}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/task/task.js



class TaskLinkProxy {
  constructor(task, performType, linkedObject) {
    this.task = task;
    this.performType = performType;
    this.linkedObject = linkedObject;
  }

  perform(...args) {
    return this.task._performShared(args, this.performType, this.linkedObject);
  }

}

class task_Task extends Taskable {
  constructor(options) {
    super(options);
    this.perform = this._perform.bind(this);
  }

  linked() {
    let linkedObject = getRunningInstance();

    if (!linkedObject) {
      throw new Error(`You can only call .linked() from within a task.`);
    }

    return new TaskLinkProxy(this, PERFORM_TYPE_LINKED, linkedObject);
  }

  unlinked() {
    return new TaskLinkProxy(this, PERFORM_TYPE_UNLINKED, null);
  }

  _perform() {}

}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/task-instance/base.js



const EXPLICIT_CANCEL_REASON = ".cancel() was explicitly called";
class BaseTaskInstance {
  constructor({
    task,
    args,
    executor,
    performType,
    hasEnabledEvents
  }) {
    this.task = task;
    this.args = args;
    this.performType = performType;
    this.executor = executor;
    this.executor.taskInstance = this;
    this.hasEnabledEvents = hasEnabledEvents;
  }

  setState() {}

  onStarted() {}

  onSuccess() {}

  onError() {}

  onCancel() {}

  formatCancelReason() {}

  selfCancelLoopWarning() {}

  onFinalize(callback) {
    this.executor.onFinalize(callback);
  }

  proceed(index, yieldResumeType, value) {
    this.executor.proceedChecked(index, yieldResumeType, value);
  }

  [yieldables_yieldableSymbol](parentTaskInstance, resumeIndex) {
    return this.executor.onYielded(parentTaskInstance, resumeIndex);
  }

  cancel(cancelReason = EXPLICIT_CANCEL_REASON) {
    this.executor.cancel(new CancelRequest(CANCEL_KIND_EXPLICIT, cancelReason));
  }

  then(...args) {
    return this.executor.promise().then(...args);
  }

  catch(...args) {
    return this.executor.promise().catch(...args);
  }

  finally(...args) {
    return this.executor.promise().finally(...args);
  }

  toString() {
    return `${this.task} TaskInstance`;
  }

  start() {
    this.executor.start();
    return this;
  }

}
Object.assign(BaseTaskInstance.prototype, INITIAL_STATE);
Object.assign(BaseTaskInstance.prototype, {
  state: 'waiting',
  isDropped: false,
  isRunning: true
});
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/tracked-state.js




function trackMixin(proto, obj, key) {
  const propDesc = Object.getOwnPropertyDescriptor(proto, key);

  propDesc.initializer = propDesc.initializer || (() => proto[key]);

  delete propDesc.value;

  const desc = Ember._tracked(obj, key, propDesc);

  obj[key] = desc;
  return obj;
}

function applyTracked(proto, initial) {
  return Object.keys(proto).reduce((acc, key) => {
    return trackMixin(proto, acc, key);
  }, initial);
}

let TRACKED_INITIAL_TASK_STATE;
let TRACKED_INITIAL_INSTANCE_STATE;

if (USE_TRACKED) {
  TRACKED_INITIAL_TASK_STATE = applyTracked(DEFAULT_STATE, {});
  TRACKED_INITIAL_TASK_STATE = applyTracked({
    numRunning: 0,
    numQueued: 0,
    isRunning: false,
    isQueued: false,
    isIdle: true,
    state: 'idle'
  }, TRACKED_INITIAL_TASK_STATE);
  TRACKED_INITIAL_INSTANCE_STATE = applyTracked(INITIAL_STATE, {});
  TRACKED_INITIAL_INSTANCE_STATE = applyTracked({
    state: 'waiting',
    isDropped: false,
    isRunning: false
  }, TRACKED_INITIAL_INSTANCE_STATE);
  Object.freeze(TRACKED_INITIAL_TASK_STATE);
  Object.freeze(TRACKED_INITIAL_INSTANCE_STATE);
}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/task-instance.js



/**
  A `TaskInstance` represent a single execution of a
  {@linkcode Task}. Every call to {@linkcode Task#perform} returns
  a `TaskInstance`.

  `TaskInstance`s are cancelable, either explicitly
  via {@linkcode TaskInstance#cancel} or {@linkcode Task#cancelAll},
  or automatically due to the host object being destroyed, or
  because concurrency policy enforced by a
  {@linkcode TaskProperty Task Modifier} canceled the task instance.

  @class TaskInstance
  @hideconstructor
*/

class TaskInstance extends BaseTaskInstance {
  setState(props) {
    let state = this._recomputeState(props);

    assignProperties(this, { ...props,
      isRunning: !props.isFinished,
      isDropped: state === 'dropped',
      state
    });
  }

  _recomputeState(props) {
    if (props.isDropped) {
      return 'dropped';
    } else if (props.isCanceled) {
      if (props.hasStarted) {
        return 'canceled';
      } else {
        return 'dropped';
      }
    } else if (props.isFinished) {
      return 'finished';
    } else if (props.hasStarted) {
      return 'running';
    } else {
      return 'waiting';
    }
  }

  onStarted() {
    this.triggerEvent("started", this);
  }

  onSuccess() {
    this.triggerEvent("succeeded", this);
  }

  onError(error) {
    this.triggerEvent("errored", this, error);
  }

  onCancel(cancelReason) {
    this.triggerEvent("canceled", this, cancelReason);
  }

  formatCancelReason(reason) {
    return `TaskInstance '${this.getName()}' was canceled because ${reason}. For more information, see: http://ember-concurrency.com/docs/task-cancelation-help`;
  }

  getName() {
    if (!this.name) {
      this.name = this.task && this.task.name || "<unknown>";
    }

    return this.name;
  }

  selfCancelLoopWarning(parent) {
    let parentName = `\`${parent.getName()}\``;
    let childName = `\`${this.getName()}\``; // eslint-disable-next-line no-console

    console.warn(`ember-concurrency detected a potentially hazardous "self-cancel loop" between parent task ${parentName} and child task ${childName}. If you want child task ${childName} to be canceled when parent task ${parentName} is canceled, please change \`.perform()\` to \`.linked().perform()\`. If you want child task ${childName} to keep running after parent task ${parentName} is canceled, change it to \`.unlinked().perform()\``);
  }

  triggerEvent(...allArgs) {
    if (!this.hasEnabledEvents) {
      return;
    }

    let taskInstance = this;
    let task = taskInstance.task;
    let host = task.context;
    let eventNamespace = task && task.name;

    if (host && host.trigger && eventNamespace) {
      let [eventType, ...args] = allArgs;
      host.trigger(`${eventNamespace}:${eventType}`, ...args);
    }
  }
  /**
   * Describes the state that the task instance is in. Can be used for debugging,
   * or potentially driving some UI state. Possible values are:
   *
   * - `"dropped"`: task instance was canceled before it started
   * - `"canceled"`: task instance was canceled before it could finish
   * - `"finished"`: task instance ran to completion (even if an exception was thrown)
   * - `"running"`: task instance is currently running (returns true even if
   *     is paused on a yielded promise)
   * - `"waiting"`: task instance hasn't begun running yet (usually
   *     because the task is using the {@linkcode TaskProperty#enqueue enqueue}
   *     task modifier)
   *
   * The animated timeline examples on the [Task Concurrency](/docs/task-concurrency)
   * docs page make use of this property.
   *
   * @name state
   * @memberof TaskInstance
   * @instance
   * @readOnly
   */

  /**
   * True if the TaskInstance was canceled before it could
   * ever start running. For example, calling
   * {@linkcode Task#perform .perform()} twice on a
   * task with the {@linkcode TaskProperty#drop drop} modifier applied
   * will result in the second task instance being dropped.
   *
   * @name isDropped
   * @memberof TaskInstance
   * @instance
   * @readOnly
   */

  /**
   * True if the task is still running.
   *
   * @name isRunning
   * @memberof TaskInstance
   * @instance
   * @readOnly
   */

  /**
   * Event emitted when a new {@linkcode TaskInstance} starts executing.
   *
   * `on` from `@ember/object/evented` may be used to create a binding on the host object to the event.
   *
   * ```js
   * export default Component.extend({
   *   doSomething: task(function * () {
   *     // ... does something
   *   }),
   *
   *   onDoSomethingStarted: on('doSomething:started', function (taskInstance) {
   *     // ...
   *   })
   * });
   * ```
   *
   * @event TaskInstance#TASK_NAME:started
   * @param {TaskInstance} taskInstance - Task instance that was started
   */

  /**
   * Event emitted when a {@linkcode TaskInstance} succeeds.
   *
   * `on` from `@ember/object/evented` may be used to create a binding on the host object to the event.
   *
   * ```js
   * export default Component.extend({
   *   doSomething: task(function * () {
   *     // ... does something
   *   }),
   *
   *   onDoSomethingSucceeded: on('doSomething:succeeded', function (taskInstance) {
   *     // ...
   *   })
   * });
   * ```
   *
   * @event TaskInstance#TASK_NAME:succeeded
   * @param {TaskInstance} taskInstance - Task instance that was succeeded
   */

  /**
   * Event emitted when a {@linkcode TaskInstance} throws an an error that is
   * not handled within the task itself.
   *
   * `on` from `@ember/object/evented` may be used to create a binding on the host object to the event.
   *
   * ```js
   * export default Component.extend({
   *   doSomething: task(function * () {
   *     // ... does something
   *   }),
   *
   *   onDoSomethingErrored: on('doSomething:errored', function (taskInstance, error) {
   *     // ...
   *   })
   * });
   * ```
   *
   * @event TaskInstance#TASK_NAME:errored
   * @param {TaskInstance} taskInstance - Task instance that was started
   * @param {Error} error - Error that was thrown by the task instance
   */

  /**
   * Event emitted when a {@linkcode TaskInstance} is canceled.
   *
   * `on` from `@ember/object/evented` may be used to create a binding on the host object to the event.
   *
   * ```js
   * export default Component.extend({
   *   doSomething: task(function * () {
   *     // ... does something
   *   }),
   *
   *   onDoSomethingCanceled: on('doSomething:canceled', function (taskInstance, cancelationReason) {
   *     // ...
   *   })
   * });
   * ```
   *
   * @event TaskInstance#TASK_NAME:canceled
   * @param {TaskInstance} taskInstance - Task instance that was started
   * @param {string} cancelationReason - Cancelation reason that was was provided to {@linkcode TaskInstance#cancel}
   */

  /**
   * Cancels the task instance. Has no effect if the task instance has
   * already been canceled or has already finished running.
   *
   * @method cancel
   * @memberof TaskInstance
   * @instance
   * @async
   */

  /**
   * Returns a promise that resolves with the value returned
   * from the task's (generator) function, or rejects with
   * either the exception thrown from the task function, or
   * an error with a `.name` property with value `"TaskCancelation"`.
   *
   * @method then
   * @memberof TaskInstance
   * @instance
   * @return {Promise}
   */

  /**
   * @method catch
   * @memberof TaskInstance
   * @instance
   * @return {Promise}
   */

  /**
   * @method finally
   * @memberof TaskInstance
   * @instance
   * @return {Promise}
   */


}

if (TRACKED_INITIAL_INSTANCE_STATE) {
  Object.defineProperties(TaskInstance.prototype, TRACKED_INITIAL_INSTANCE_STATE);
}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/taskable-mixin.js

const TASKABLE_MIXIN = {
  _performCount: 0,

  setState(state) {
    this._performCount = this._performCount + (state.numPerformedInc || 0);
    let isRunning = state.numRunning > 0;
    let isQueued = state.numQueued > 0;
    let derivedState = Object.assign({}, state, {
      performCount: this._performCount,
      isRunning,
      isQueued,
      isIdle: !isRunning && !isQueued,
      state: isRunning ? "running" : "idle"
    });
    assignProperties(this, derivedState);
  },

  onState(state, task) {
    if (task.onStateCallback) {
      task.onStateCallback(state, task);
    }
  }

};
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/task.js







/**
  The `Task` object lives on a host Ember object (e.g.
  a Component, Route, or Controller). You call the
  {@linkcode Task#perform .perform()} method on this object
  to create run individual {@linkcode TaskInstance}s,
  and at any point, you can call the {@linkcode Task#cancelAll .cancelAll()}
  method on this object to cancel all running or enqueued
  {@linkcode TaskInstance}s.

  @class Task
  @hideconstructor
*/

class Task extends task_Task {
  constructor(options) {
    super(options);

    if (!Ember._isDestroying(this.context)) {
      Ember._registerDestructor(this.context, () => {
        this.cancelAll({
          reason: 'the object it lives on was destroyed or unrendered',
          cancelRequestKind: CANCEL_KIND_LIFESPAN_END
        });
      });
    }
  }
  /**
   * Flags the task as linked to the parent task's lifetime. Must be called
   * within another task's perform function. The task will be cancelled if the
   * parent task is canceled as well.
   *
   * ember-concurrency will indicate when this may be needed.
   *
   * @method linked
   * @memberof Task
   * @instance
   *
   */

  /**
   * Flags the task as not linked to the parent task's lifetime. Must be called
   * within another task's perform function. The task will NOT be cancelled if the
   * parent task is canceled.
   *
   * This is useful for avoiding the so-called "self-cancel loop" for tasks.
   * ember-concurrency will indicate when this may be needed.
   *
   * @method unlinked
   * @memberof Task
   * @instance
   *
   */

  /**
   * Creates a new {@linkcode TaskInstance} and attempts to run it right away.
   * If running this task instance would increase the task's concurrency
   * to a number greater than the task's maxConcurrency, this task
   * instance might be immediately canceled (dropped), or enqueued
   * to run at later time, after the currently running task(s) have finished.
   *
   * @method perform
   * @memberof Task
   * @param {*} arg* - args to pass to the task function
   * @instance
   *
   * @fires TaskInstance#TASK_NAME:started
   * @fires TaskInstance#TASK_NAME:succeeded
   * @fires TaskInstance#TASK_NAME:errored
   * @fires TaskInstance#TASK_NAME:canceled
   *
   */

  /**
   * Cancels all running or queued `TaskInstance`s for this Task.
   * If you're trying to cancel a specific TaskInstance (rather
   * than all of the instances running under this task) call
   * `.cancel()` on the specific TaskInstance.
   *
   * @method cancelAll
   * @memberof Task
   * @param options.reason A descriptive reason the task was
   *   cancelled. Defaults to `".cancelAll() was explicitly called
   *   on the Task"`.
   * @param options.resetState If true, will clear the task state
   *   (`last*` and `performCount` properties will be set to initial
   *   values). Defaults to false.
   * @instance
   * @async
   *
   */


  _perform(...args) {
    return this._performShared(args, PERFORM_TYPE_DEFAULT, null);
  }

  _performShared(args, performType, linkedObject) {
    let fullArgs = this._curryArgs ? [...this._curryArgs, ...args] : args;

    let taskInstance = this._taskInstanceFactory(fullArgs, performType, linkedObject);

    if (performType === PERFORM_TYPE_LINKED) {
      linkedObject._expectsLinkedYield = true;
    }

    if (Ember._isDestroying(this.context)) {
      // TODO: express this in terms of lifetimes; a task linked to
      // a dead lifetime should immediately cancel.
      taskInstance.cancel();
    }

    this.scheduler.perform(taskInstance);
    return taskInstance;
  }

  _taskInstanceFactory(args, performType) {
    let generatorFactory = () => this.generatorFactory(args);

    let taskInstance = new TaskInstance({
      task: this,
      args,
      executor: new TaskInstanceExecutor({
        generatorFactory,
        env: ember_environment_EMBER_ENVIRONMENT,
        debug: this.debug
      }),
      performType,
      hasEnabledEvents: this.hasEnabledEvents
    });
    return taskInstance;
  }

  _curry(...args) {
    let task = this._clone();

    task._curryArgs = [...(this._curryArgs || []), ...args];
    return task;
  }

  _clone() {
    return new Task(this.options);
  }

  toString() {
    return `<Task:${this.name}>`;
  }
  /**
   * `true` if any current task instances are running.
   *
   * @memberof Task
   * @member {boolean} isRunning
   * @instance
   * @readOnly
   */

  /**
   * `true` if any future task instances are queued.
   *
   * @memberof Task
   * @member {boolean} isQueued
   * @instance
   * @readOnly
   */

  /**
   * `true` if the task is not in the running or queued state.
   *
   * @memberof Task
   * @member {boolean} isIdle
   * @instance
   * @readOnly
   */

  /**
   * The current state of the task: `"running"`, `"queued"` or `"idle"`.
   *
   * @memberof Task
   * @member {string} state
   * @instance
   * @readOnly
   */

  /**
   * The most recently started task instance.
   *
   * @memberof Task
   * @member {TaskInstance} last
   * @instance
   * @readOnly
   */

  /**
   * The most recent task instance that is currently running.
   *
   * @memberof Task
   * @member {TaskInstance} lastRunning
   * @instance
   * @readOnly
   */

  /**
   * The most recently performed task instance.
   *
   * @memberof Task
   * @member {TaskInstance} lastPerformed
   * @instance
   * @readOnly
   */

  /**
   * The most recent task instance that succeeded.
   *
   * @memberof Task
   * @member {TaskInstance} lastSuccessful
   * @instance
   * @readOnly
   */

  /**
   * The most recently completed task instance.
   *
   * @memberof Task
   * @member {TaskInstance} lastComplete
   * @instance
   * @readOnly
   */

  /**
   * The most recent task instance that errored.
   *
   * @memberof Task
   * @member {TaskInstance} lastErrored
   * @instance
   * @readOnly
   */

  /**
   * The most recently canceled task instance.
   *
   * @memberof Task
   * @member {TaskInstance} lastCanceled
   * @instance
   * @readOnly
   */

  /**
   * The most recent task instance that is incomplete.
   *
   * @memberof Task
   * @member {TaskInstance} lastIncomplete
   * @instance
   * @readOnly
   */

  /**
   * The number of times this task has been performed.
   *
   * @memberof Task
   * @member {number} performCount
   * @instance
   * @readOnly
   */


}

if (TRACKED_INITIAL_TASK_STATE) {
  Object.defineProperties(Task.prototype, TRACKED_INITIAL_TASK_STATE);
}

Object.assign(Task.prototype, TASKABLE_MIXIN);
class EncapsulatedTask extends Task {
  constructor(options) {
    super(options);
    this.taskObj = options.taskObj;
    this._encapsulatedTaskStates = new WeakMap();
    this._encapsulatedTaskInstanceProxies = new WeakMap();
  }

  _taskInstanceFactory(args, performType) {
    let owner = Ember.getOwner(this.context);
    let encapsulatedTaskImpl = Ember.Object.extend(this.taskObj).create({
      context: this.context
    });
    Ember.setOwner(encapsulatedTaskImpl, owner);

    let generatorFactory = () => encapsulatedTaskImpl.perform.apply(encapsulatedTaskImpl, args);

    let taskInstance = new TaskInstance({
      task: this,
      args,
      executor: new TaskInstanceExecutor({
        generatorFactory,
        env: ember_environment_EMBER_ENVIRONMENT,
        debug: this.debug
      }),
      performType,
      hasEnabledEvents: this.hasEnabledEvents
    });

    this._encapsulatedTaskStates.set(taskInstance, encapsulatedTaskImpl);

    return this._wrappedEncapsulatedTaskInstance(taskInstance);
  }

  _wrappedEncapsulatedTaskInstance(taskInstance) {
    if (!taskInstance) {
      return null;
    }

    let _encapsulatedTaskInstanceProxies = this._encapsulatedTaskInstanceProxies;

    let proxy = _encapsulatedTaskInstanceProxies.get(taskInstance);

    if (!proxy) {
      let encapsulatedTaskImpl = this._encapsulatedTaskStates.get(taskInstance);

      proxy = new Proxy(taskInstance, {
        get(obj, prop) {
          return prop in obj ? obj[prop] : Ember.get(encapsulatedTaskImpl, prop.toString());
        },

        has(obj, prop) {
          return prop in obj || prop in encapsulatedTaskImpl;
        },

        ownKeys(obj) {
          return Reflect.ownKeys(obj).concat(Reflect.ownKeys(encapsulatedTaskImpl));
        },

        defineProperty(obj, prop, descriptor) {
          // Ember < 3.16 uses a WeakMap for value storage, keyed to the proxy.
          // We need to ensure that when we use setProperties to update it, and
          // it creates Meta, that it uses the proxy to key, otherwise we'll
          // have two different values stores in Meta, one which won't render.
          let proxy = _encapsulatedTaskInstanceProxies.get(taskInstance);

          if (proxy) {
            if (descriptor.get) {
              descriptor.get = descriptor.get.bind(proxy);
            } else if (proxy && descriptor.set) {
              descriptor.set = descriptor.set.bind(proxy);
            }
          }

          return prop in obj ? Reflect.defineProperty(obj, prop, descriptor) : Reflect.defineProperty(encapsulatedTaskImpl, prop, descriptor);
        },

        getOwnPropertyDescriptor(obj, prop) {
          return prop in obj ? Reflect.getOwnPropertyDescriptor(obj, prop) : Reflect.getOwnPropertyDescriptor(encapsulatedTaskImpl, prop);
        }

      });

      _encapsulatedTaskInstanceProxies.set(taskInstance, proxy);
    }

    return proxy;
  }

}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/task/task-group.js

class task_group_TaskGroup extends Taskable {}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/task-group.js



class TaskGroup extends task_group_TaskGroup {
  /**
   * Cancels all running or queued `TaskInstance`s for this task group.
   * If you're trying to cancel a specific TaskInstance (rather
   * than all of the instances running under this task group) call
   * `.cancel()` on the specific TaskInstance.
   *
   * @method cancelAll
   * @memberof TaskGroup
   * @param options.reason A descriptive reason the task group was
   *   cancelled. Defaults to `".cancelAll() was explicitly called
   *   on the Task"`.
   * @param options.resetState If true, will clear the task group state
   *   (`last*` and `performCount` properties will be set to initial
   *   values). Defaults to false.
   * @instance
   * @async
   *
   */

  /**
  * `true` if any current task instances are running.
  *
  * @memberof TaskGroup
  * @member {boolean} isRunning
  * @instance
  * @readOnly
  */

  /**
   * `true` if any future task instances are queued.
   *
   * @memberof TaskGroup
   * @member {boolean} isQueued
   * @instance
   * @readOnly
   */

  /**
   * `true` if the task is not in the running or queued state.
   *
   * @memberof TaskGroup
   * @member {boolean} isIdle
   * @instance
   * @readOnly
   */

  /**
   * The current state of the task: `"running"`, `"queued"` or `"idle"`.
   *
   * @memberof TaskGroup
   * @member {string} state
   * @instance
   * @readOnly
   */

  /**
   * The most recently started task instance.
   *
   * @memberof TaskGroup
   * @member {TaskInstance} last
   * @instance
   * @readOnly
   */

  /**
   * The most recent task instance that is currently running.
   *
   * @memberof TaskGroup
   * @member {TaskInstance} lastRunning
   * @instance
   * @readOnly
   */

  /**
   * The most recently performed task instance.
   *
   * @memberof TaskGroup
   * @member {TaskInstance} lastPerformed
   * @instance
   * @readOnly
   */

  /**
   * The most recent task instance that succeeded.
   *
   * @memberof TaskGroup
   * @member {TaskInstance} lastSuccessful
   * @instance
   * @readOnly
   */

  /**
   * The most recently completed task instance.
   *
   * @memberof TaskGroup
   * @member {TaskInstance} lastComplete
   * @instance
   * @readOnly
   */

  /**
   * The most recent task instance that errored.
   *
   * @memberof TaskGroup
   * @member {TaskInstance} lastErrored
   * @instance
   * @readOnly
   */

  /**
   * The most recently canceled task instance.
   *
   * @memberof TaskGroup
   * @member {TaskInstance} lastCanceled
   * @instance
   * @readOnly
   */

  /**
   * The most recent task instance that is incomplete.
   *
   * @memberof TaskGroup
   * @member {TaskInstance} lastIncomplete
   * @instance
   * @readOnly
   */

  /**
   * The number of times this task has been performed.
   *
   * @memberof TaskGroup
   * @member {number} performCount
   * @instance
   * @readOnly
   */
}

if (TRACKED_INITIAL_TASK_STATE) {
  Object.defineProperties(TaskGroup.prototype, TRACKED_INITIAL_TASK_STATE);
}

Object.assign(TaskGroup.prototype, TASKABLE_MIXIN);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/refresh.js


class Refresh {
  constructor(schedulerPolicy, stateTracker, taskInstances) {
    this.stateTracker = stateTracker;
    this.schedulerPolicy = schedulerPolicy;
    this.initialTaskInstances = taskInstances;
    this.startingInstances = [];
  }

  process() {
    let [taskInstances, numRunning, numQueued] = this.filterFinishedTaskInstances();
    let reducer = this.schedulerPolicy.makeReducer(numRunning, numQueued);
    let finalTaskInstances = taskInstances.filter(taskInstance => {
      return this.setTaskInstanceExecutionState(taskInstance, reducer.step());
    });
    this.stateTracker.computeFinalStates(state => this.applyState(state));
    this.startingInstances.forEach(taskInstance => taskInstance.start());
    return finalTaskInstances;
  }

  filterFinishedTaskInstances() {
    let numRunning = 0,
        numQueued = 0;
    let taskInstances = this.initialTaskInstances.filter(taskInstance => {
      let taskState = this.stateTracker.stateFor(taskInstance.task);
      let executorState = taskInstance.executor.state;

      if (executorState.isFinished) {
        taskState.onCompletion(taskInstance);
        return false;
      }

      if (executorState.hasStarted) {
        numRunning += 1;
      } else {
        numQueued += 1;
      }

      return true;
    });
    return [taskInstances, numRunning, numQueued];
  }

  setTaskInstanceExecutionState(taskInstance, desiredState) {
    let taskState = this.stateTracker.stateFor(taskInstance.task);

    if (!taskInstance.executor.counted) {
      taskInstance.executor.counted = true;
      taskState.onPerformed(taskInstance);
    }

    switch (desiredState.type) {
      case TYPE_CANCELLED:
        // this will cause a follow up flush which will detect and recompute cancellation state
        taskInstance.cancel(desiredState.reason);
        return false;

      case TYPE_STARTED:
        if (!taskInstance.executor.state.hasStarted) {
          this.startingInstances.push(taskInstance);
          taskState.onStart(taskInstance);
        }

        taskState.onRunning(taskInstance);
        return true;

      case TYPE_QUEUED:
        taskState.onQueued(taskInstance); // TODO: assert taskInstance hasn't started?
        // Or perhaps this can be a way to pause a task?

        return true;
    }
  }

  applyState(state) {
    let {
      taskable
    } = state;

    if (!taskable.onState) {
      return;
    }

    let props = Object.assign({
      numRunning: state.numRunning,
      numQueued: state.numQueued,
      numPerformedInc: state.numPerformedInc
    }, state.attrs);
    taskable.onState(props, taskable);
  }

}

/* harmony default export */ const scheduler_refresh = (Refresh);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/state-tracker/state.js


class RefreshState {
  constructor(taskable) {
    this.taskable = taskable;
    this.group = taskable.group;
    this.numRunning = 0;
    this.numQueued = 0;
    this.numPerformedInc = 0;
    this.attrs = {};
  }

  onCompletion(taskInstance) {
    let state = taskInstance.completionState;
    this.attrs.lastRunning = null;
    this.attrs.lastComplete = taskInstance;

    if (state === COMPLETION_SUCCESS) {
      this.attrs.lastSuccessful = taskInstance;
    } else {
      if (state === COMPLETION_ERROR) {
        this.attrs.lastErrored = taskInstance;
      } else if (state === COMPLETION_CANCEL) {
        this.attrs.lastCanceled = taskInstance;
      }

      this.attrs.lastIncomplete = taskInstance;
    }
  }

  onPerformed(taskInstance) {
    this.numPerformedInc += 1;
    this.attrs.lastPerformed = taskInstance;
  }

  onStart(taskInstance) {
    // a.k.a. lastStarted
    this.attrs.last = taskInstance;
  }

  onRunning(taskInstance) {
    this.attrs.lastRunning = taskInstance;
    this.numRunning += 1;
  }

  onQueued() {
    this.numQueued += 1;
  }

  recurseTaskGroups(callback) {
    let group = this.group;

    while (group) {
      callback(group);
      group = group.group;
    }
  }

  applyStateFrom(other) {
    Object.assign(this.attrs, other.attrs);
    this.numRunning += other.numRunning;
    this.numQueued += other.numQueued;
    this.numPerformedInc += other.numPerformedInc;
  }

}

/* harmony default export */ const state = (RefreshState);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/state-tracker/state-tracker.js


class StateTracker {
  constructor() {
    this.states = {};
  }

  stateFor(taskable) {
    let guid = taskable.guid;
    let taskState = this.states[guid];

    if (!taskState) {
      taskState = this.states[guid] = new state(taskable);
    }

    return taskState;
  } // After cancelling/queueing task instances, we have to recompute the derived state
  // of all the tasks that had/have task instances in this scheduler. We do this by
  // looping through all the Tasks that we've accumulated state for, and then recursively
  // applying/adding to the state of any TaskGroups they belong to.


  computeFinalStates(callback) {
    this.computeRecursiveState();
    this.forEachState(state => callback(state));
  }

  computeRecursiveState() {
    this.forEachState(taskState => {
      let lastState = taskState;
      taskState.recurseTaskGroups(taskGroup => {
        let state = this.stateFor(taskGroup);
        state.applyStateFrom(lastState);
        lastState = state;
      });
    });
  }

  forEachState(callback) {
    Object.keys(this.states).forEach(k => callback(this.states[k]));
  }

}

/* harmony default export */ const state_tracker = (StateTracker);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/state-tracker/null-state.js
class NullState {
  onCompletion() {}

  onPerformed() {}

  onStart() {}

  onRunning() {}

  onQueued() {}

}

/* harmony default export */ const null_state = (NullState);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/state-tracker/null-state-tracker.js

const NULL_STATE = new null_state();

class NullStateTracker {
  stateFor() {
    return NULL_STATE;
  }

  computeFinalStates() {}

}

/* harmony default export */ const null_state_tracker = (NullStateTracker);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/external/scheduler/scheduler.js


 // Scheduler base class
// When a Task is performed, it creates an unstarted TaskInstance and
// passes it to the Scheduler to determine when it should run. The
// scheduler consults the schedulerPolicy (e.g. DropPolicy, RestartablePolicy, etc)
// to determine whether the task instance should start executing, be enqueued
// for later execution, or be immediately cancelled. As TaskInstances start
// and run to completion, the Scheduler's `refresh()` method is called to
// give it an opportunity to start (or cancel) previously enqueued task instances,
// as well as update the derived state on Tasks and TaskGroups.
// Every Task has its own Scheduler instance, unless it is part of a group,
// in which case all the Tasks in a group share a single Scheduler.

class Scheduler {
  constructor(schedulerPolicy, stateTrackingEnabled) {
    this.schedulerPolicy = schedulerPolicy;
    this.stateTrackingEnabled = stateTrackingEnabled;
    this.taskInstances = [];
  }

  cancelAll(guid, cancelRequest) {
    let cancelations = this.taskInstances.map(taskInstance => {
      if (taskInstance.task.guids[guid]) {
        taskInstance.executor.cancel(cancelRequest);
      }
    }).filter(cancelation => !!cancelation);
    return Promise.all(cancelations);
  }

  perform(taskInstance) {
    taskInstance.onFinalize(() => this.scheduleRefresh());
    this.taskInstances.push(taskInstance);
    this.refresh();
  } // override


  scheduleRefresh() {}

  refresh() {
    let stateTracker = this.stateTrackingEnabled ? new state_tracker() : new null_state_tracker();
    let refresh = new scheduler_refresh(this.schedulerPolicy, stateTracker, this.taskInstances);
    this.taskInstances = refresh.process();
  }

}

/* harmony default export */ const scheduler = (Scheduler);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/scheduler/ember-scheduler.js


class EmberScheduler extends scheduler {
  scheduleRefresh() {
    Ember.run.once(this, this.refresh);
  }

}

/* harmony default export */ const ember_scheduler = (EmberScheduler);
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/task-factory.js
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}










let handlerCounter = 0;

function assertModifiersNotMixedWithGroup(obj) {
  ( false && 0);
}

function assertUnsetBufferPolicy(obj) {
  ( false && 0);
}

function registerOnPrototype(addListenerOrObserver, proto, names, taskName, taskMethod, once) {
  if (names) {
    for (let i = 0; i < names.length; ++i) {
      let name = names[i];
      let handlerName = `__ember_concurrency_handler_${handlerCounter++}`;
      proto[handlerName] = makeTaskCallback(taskName, taskMethod, once);
      addListenerOrObserver(proto, name, null, handlerName);
    }
  }
}

function makeTaskCallback(taskName, method, once) {
  return function () {
    let task = Ember.get(this, taskName);

    if (once) {
      Ember.run.scheduleOnce("actions", task, method, ...arguments);
    } else {
      task[method].apply(task, arguments);
    }
  };
}

const ensureArray = possibleArr => Array.isArray(possibleArr) ? possibleArr : [possibleArr];

const optionRegistry = {
  cancelOn: (factory, eventNames) => factory.addCancelEvents(...ensureArray(eventNames)),
  enqueue: factory => factory.setBufferPolicy(enqueued_policy),
  evented: factory => factory.setEvented(true),
  debug: factory => factory.setDebug(true),
  drop: factory => factory.setBufferPolicy(drop_policy),
  group: (factory, groupName) => factory.setGroup(groupName),
  keepLatest: factory => factory.setBufferPolicy(keep_latest_policy),
  maxConcurrency: (factory, maxConcurrency) => factory.setMaxConcurrency(maxConcurrency),
  observes: (factory, propertyPaths) => factory.addObserverKeys(...ensureArray(propertyPaths)),
  on: (factory, eventNames) => factory.addPerformEvents(...ensureArray(eventNames)),
  onState: (factory, onStateCallback) => factory.setOnState(onStateCallback),
  restartable: factory => factory.setBufferPolicy(restartable_policy)
};
class TaskFactory {
  constructor(name = "<unknown>", taskDefinition = null, options = {}) {
    _defineProperty(this, "_cancelEventNames", []);

    _defineProperty(this, "_debug", null);

    _defineProperty(this, "_eventNames", []);

    _defineProperty(this, "_hasUsedModifier", false);

    _defineProperty(this, "_hasSetBufferPolicy", false);

    _defineProperty(this, "_hasEnabledEvents", false);

    _defineProperty(this, "_maxConcurrency", null);

    _defineProperty(this, "_observes", []);

    _defineProperty(this, "_onStateCallback", (state, taskable) => taskable.setState(state));

    _defineProperty(this, "_schedulerPolicyClass", unbounded_policy);

    _defineProperty(this, "_taskGroupPath", null);

    this.name = name;
    this.taskDefinition = taskDefinition;

    this._processOptions(options);
  }

  createTask(context) {
    ( false && 0);

    let options = this._sharedTaskProperties(context);

    if (typeof this.taskDefinition === "object") {
      return new EncapsulatedTask(Object.assign({
        taskObj: this.taskDefinition
      }, options));
    } else {
      return new Task(Object.assign({
        generatorFactory: args => this.taskDefinition.apply(context, args)
      }, options));
    }
  }

  addCancelEvents(...cancelEventNames) {
    this._cancelEventNames.push(...cancelEventNames);

    return this;
  }

  addObserverKeys(...keys) {
    this._observes.push(...keys);

    return this;
  }

  addPerformEvents(...eventNames) {
    this._eventNames.push(...eventNames);

    return this;
  }

  setBufferPolicy(policy) {
    assertUnsetBufferPolicy(this);
    this._hasSetBufferPolicy = true;
    this._hasUsedModifier = true;
    this._schedulerPolicyClass = policy;
    assertModifiersNotMixedWithGroup(this);
    return this;
  }

  setDebug(debug) {
    this._debug = debug;
    return this;
  }

  setEvented(evented) {
    this._hasEnabledEvents = evented;
    return this;
  }

  setMaxConcurrency(maxConcurrency) {
    ( false && 0);
    this._hasUsedModifier = true;
    this._maxConcurrency = maxConcurrency;
    assertModifiersNotMixedWithGroup(this);
    return this;
  }

  setGroup(group) {
    this._taskGroupPath = group;
    assertModifiersNotMixedWithGroup(this);
    return this;
  }

  setName(name) {
    this.name = name;
    return this;
  }

  setOnState(onStateCallback) {
    this._onStateCallback = onStateCallback;
    return this;
  }

  setTaskDefinition(taskDefinition) {
    ( false && 0);
    this.taskDefinition = taskDefinition;
    return this;
  }

  _processOptions(options) {
    for (let key of Object.keys(options)) {
      let value = options[key];

      if (optionRegistry[key]) {
        optionRegistry[key].call(null, this, value);
      } else if (typeof TaskProperty.prototype[key] === "function") {
        // Shim for compatibility with user-defined TaskProperty prototype
        // extensions. To be removed when replaced with proper public API.
        TaskProperty.prototype[key].call(this, value);
      } else {
        ( false && 0);
      }
    }
  }

  _setupEmberKVO(proto) {
    // TODO: Does this make sense in a post-Ember object world?
    registerOnPrototype(Ember.addListener, proto, this._eventNames, this.name, "perform", false);
    registerOnPrototype(Ember.addListener, proto, this._cancelEventNames, this.name, "cancelAll", false);
    registerOnPrototype(Ember.addObserver, proto, this._observes, this.name, "perform", true);
  }

  _sharedTaskProperties(context) {
    let group, scheduler;
    let onStateCallback = this._onStateCallback;

    if (this._taskGroupPath) {
      group = context[this._taskGroupPath];
      ( false && 0);
      scheduler = group.scheduler;
    } else {
      let schedulerPolicy = new this._schedulerPolicyClass(this._maxConcurrency);
      scheduler = new ember_scheduler(schedulerPolicy, onStateCallback);
    }

    return {
      context,
      debug: this._debug,
      name: this.name,
      group,
      scheduler,
      hasEnabledEvents: this._hasEnabledEvents,
      onStateCallback
    };
  } // Provided for compatibility with ember-concurrency TaskProperty extension
  // methods


  get taskFn() {
    return this.taskDefinition;
  }

  set taskFn(fn) {
    this.setTaskDefinition(fn);
  }

}
class task_factory_TaskGroupFactory extends TaskFactory {
  createTaskGroup(context) {
    ( false && 0);

    let options = this._sharedTaskProperties(context);

    return new TaskGroup(options);
  }

}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/task-decorators.js



function taskFromPropertyDescriptor(target, key, descriptor, params = []) {
  let {
    initializer,
    get,
    value
  } = descriptor;
  let taskFn;

  if (initializer) {
    taskFn = initializer.call(undefined);
  } else if (get) {
    taskFn = get.call(undefined);
  } else if (value) {
    taskFn = value;
  }

  taskFn.displayName = `${key} (task)`;
  let tasks = new WeakMap();
  let options = params[0] || {};
  let factory = new TaskFactory(key, taskFn, options);

  factory._setupEmberKVO(target);

  return {
    get() {
      let task = tasks.get(this);

      if (!task) {
        task = factory.createTask(this);
        tasks.set(this, task);
      }

      return task;
    }

  };
}

function taskGroupPropertyDescriptor(target, key, _descriptor, params = []) {
  let taskGroups = new WeakMap();
  let options = params[0] || {};
  let factory = new task_factory_TaskGroupFactory(key, null, options);
  return {
    get() {
      let task = taskGroups.get(this);

      if (!task) {
        task = factory.createTaskGroup(this);
        taskGroups.set(this, task);
      }

      return task;
    }

  };
} // Cribbed from @ember-decorators/utils


function isFieldDescriptor(possibleDesc) {
  let [target, key, desc] = possibleDesc;
  return possibleDesc.length === 3 && typeof target === 'object' && target !== null && typeof key === 'string' && (typeof desc === 'object' && desc !== null && 'enumerable' in desc && 'configurable' in desc || desc === undefined) // TS compatibility ???
  ;
}

function decoratorWithParams(descriptorFn) {
  return function (...params) {
    if (isFieldDescriptor(params)) {
      return descriptorFn(...params);
    } else {
      return (...desc) => descriptorFn(...desc, params);
    }
  };
}

function createDecorator(fn, baseOptions = {}) {
  return decoratorWithParams((target, key, descriptor, [userOptions] = []) => {
    let mergedOptions = Object.assign({}, { ...baseOptions,
      ...userOptions
    });
    return fn(target, key, descriptor, [mergedOptions]);
  });
}

const lastValue = decoratorWithParams((target, key, descriptor, [taskName] = []) => {
  const {
    initializer
  } = descriptor;
  delete descriptor.initializer;

  if (USE_TRACKED) {
    return {
      get() {
        let lastInstance = this[taskName].lastSuccessful;

        if (lastInstance) {
          return lastInstance.value;
        }

        if (initializer) {
          return initializer.call(this);
        }

        return undefined;
      }

    };
  } else {
    let cp = Ember.computed(`${taskName}.lastSuccessful`, function () {
      let lastInstance = Ember.get(this, `${taskName}.lastSuccessful`);

      if (lastInstance) {
        return Ember.get(lastInstance, 'value');
      }

      if (initializer) {
        return initializer.call(this);
      }

      return undefined;
    });
    return cp(target, key, descriptor);
  }
});
/**
 * A Task is a cancelable, restartable, asynchronous operation that
 * is driven by a generator function. Tasks are automatically canceled
 * when the object they live on is destroyed (e.g. a Component
 * is unrendered).
 *
 * Turns the decorated generator function into a task.
 *
 * Optionally takes a hash of options that will be applied as modifiers to the
 * task. For instance `maxConcurrency`, `on`, `group` or `keepLatest`.
 *
 * By default, tasks have no concurrency constraints
 * (multiple instances of a task can be running at the same time)
 * but much of a power of tasks lies in proper usage of Task Modifiers
 * that you can apply to a task.
 *
 * You can also define an
 * <a href="/docs/encapsulated-task">Encapsulated Task</a>
 * by decorating an object that defines a `perform` generator
 * method.
 *
 * ```js
 * import Component from '@ember/component';
 * import { task } from 'ember-concurrency';
 *
 * class MyComponent extends Component {
 *   @task
 *   *plainTask() {}
 *
 *   @task({ maxConcurrency: 5, keepLatest: true, cancelOn: 'click' })
 *   *taskWithModifiers() {}
 * }
 * ```
 *
 * @function
 * @param {object?} [options={}] Task modifier options
 * @param {string|string[]} [options.cancelOn] Events to cancel task on. Applies only to `@ember/component`
 * @param {boolean} [options.enqueue] Sets `enqueue` modifier on task if `true`
 * @param {boolean} [options.evented] Enables [task lifecycle events](/docs/task-lifecycle-events) for this Task, if `true`
 * @param {boolean} [options.debug] Enables task debugging if `true`
 * @param {boolean} [options.drop] Sets `drop` modifier on task if `true`
 * @param {string} [options.group] Associates task with the group specified
 * @param {boolean} [options.keepLatest] Sets `keepLatest` modifier on task if `true`
 * @param {number} [options.maxConcurrency] Sets the maximum number of running task instances for the task
 * @param {string|string[]} [options.observes] Properties to watch and cause task to be performed when they change
 * @param {string|string[]} [options.on] Events to perform task on. Applies only to `@ember/component`
 * @param {function?} [options.onState] Callback to use for state tracking. May be set to `null` to disable state tracking.
 * @param {boolean} [options.restartable] Sets `restartable` modifier on task if `true`
 * @return {Task}
 */

const task = createDecorator(taskFromPropertyDescriptor);
/**
 * Turns the decorated generator function into a task and applies the
 * `drop` modifier.
 *
 * Optionally takes a hash of options that will be applied as modifiers to the
 * task. For instance `maxConcurrency`, `on`, or `group`.
 *
 * You can also define an
 * <a href="/docs/encapsulated-task">Encapsulated Task</a>
 * by decorating an object that defines a `perform` generator
 * method.
 *
 * ```js
 * import Component from '@ember/component';
 * import { task, dropTask } from 'ember-concurrency';
 *
 * class MyComponent extends Component {
 *   @task
 *   *plainTask() {}
 *
 *   @dropTask({ cancelOn: 'click' })
 *   *myDropTask() {}
 * }
 * ```
 *
 * @function
 * @param {object?} [options={}] Task modifier options. See {@link task} for list.
 * @return {Task}
 */

const dropTask = createDecorator(taskFromPropertyDescriptor, {
  drop: true
});
/**
 * Turns the decorated generator function into a task and applies the
 * `enqueue` modifier.
 *
 * Optionally takes a hash of options that will be applied as modifiers to the
 * task. For instance `maxConcurrency`, `on`, or `group`.
 *
 * You can also define an
 * <a href="/docs/encapsulated-task">Encapsulated Task</a>
 * by decorating an object that defines a `perform` generator
 * method.
 *
 * ```js
 * import Component from '@ember/component';
 * import { task, enqueueTask } from 'ember-concurrency';
 *
 * class MyComponent extends Component {
 *   @task
 *   *plainTask() {}
 *
 *   @enqueueTask({ cancelOn: 'click' })
 *   *myEnqueueTask() {}
 * }
 * ```
 *
 * @function
 * @param {object?} [options={}] Task modifier options. See {@link task} for list.
 * @return {Task}
 */

const enqueueTask = createDecorator(taskFromPropertyDescriptor, {
  enqueue: true
});
/**
 * Turns the decorated generator function into a task and applies the
 * `keepLatest` modifier.
 *
 * Optionally takes a hash of options that will be applied as modifiers to the
 * task. For instance `maxConcurrency`, `on`, or `group`.
 *
 * You can also define an
 * <a href="/docs/encapsulated-task">Encapsulated Task</a>
 * by decorating an object that defines a `perform` generator
 * method.
 *
 * ```js
 * import Component from '@ember/component';
 * import { task, keepLatestTask } from 'ember-concurrency';
 *
 * class MyComponent extends Component {
 *   @task
 *   *plainTask() {}
 *
 *   @keepLatestTask({ cancelOn: 'click' })
 *   *myKeepLatestTask() {}
 * }
 * ```
 *
 * @function
 * @param {object?} [options={}] Task modifier options. See {@link task} for list.
 * @return {Task}
 */

const keepLatestTask = createDecorator(taskFromPropertyDescriptor, {
  keepLatest: true
});
/**
 * Turns the decorated generator function into a task and applies the
 * `restartable` modifier.
 *
 * Optionally takes a hash of options that will be applied as modifiers to the
 * task. For instance `maxConcurrency`, `on`, or `group`.
 *
 * You can also define an
 * <a href="/docs/encapsulated-task">Encapsulated Task</a>
 * by decorating an object that defines a `perform` generator
 * method.
 *
 * ```js
 * import Component from '@ember/component';
 * import { task, restartableTask } from 'ember-concurrency';
 *
 * class MyComponent extends Component {
 *   @task
 *   *plainTask() {}
 *
 *   @restartableTask({ cancelOn: 'click' })
 *   *myRestartableTask() {}
 * }
 * ```
 *
 * @function
 * @param {object?} [options={}] Task modifier options. See {@link task} for list.
 * @return {Task}
 */

const restartableTask = createDecorator(taskFromPropertyDescriptor, {
  restartable: true
});
/**
 * "Task Groups" provide a means for applying
 * task modifiers to groups of tasks. Once a {@linkcode Task} is declared
 * as part of a group task, modifiers like `drop` or `restartable`
 * will no longer affect the individual `Task`. Instead those
 * modifiers can be applied to the entire group.
 *
 * Turns the decorated property into a task group.
 *
 * Optionally takes a hash of options that will be applied as modifiers to the
 * task group. For instance `maxConcurrency` or `keepLatest`.
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { task, taskGroup } from 'ember-concurrency';
 *
 * class MyComponent extends Component {
 *   @taskGroup({ maxConcurrency: 5 }) chores;
 *
 *   @task({ group: 'chores' })
 *   *mowLawn() {}
 *
 *   @task({ group: 'chores' })
 *   *doDishes() {}
 * }
 * ```
 *
 * @function
 * @param {object?} [options={}] Task group modifier options. See {@link task} for list.
 * @return {TaskGroup}
 */

const taskGroup = createDecorator(taskGroupPropertyDescriptor);
/**
 * Turns the decorated property into a task group and applies the
 * `drop` modifier.
 *
 * Optionally takes a hash of further options that will be applied as modifiers
 * to the task group.
 *
 * @function
 * @param {object?} [options={}] Task group modifier options. See {@link task} for list.
 * @return {TaskGroup}
 */

const dropTaskGroup = createDecorator(taskGroupPropertyDescriptor, {
  drop: true
});
/**
 * Turns the decorated property into a task group and applies the
 * `enqueue` modifier.
 *
 * Optionally takes a hash of further options that will be applied as modifiers
 * to the task group.
 *
 * @function
 * @param {object?} [options={}] Task group modifier options. See {@link task} for list.
 * @return {TaskGroup}
 */

const enqueueTaskGroup = createDecorator(taskGroupPropertyDescriptor, {
  enqueue: true
});
/**
 * Turns the decorated property into a task group and applies the
 * `keepLatest` modifier.
 *
 * Optionally takes a hash of further options that will be applied as modifiers
 * to the task group.
 *
 * @function
 * @param {object?} [options={}] Task group modifier options. See {@link task} for list.
 * @return {TaskGroup}
 */

const keepLatestTaskGroup = createDecorator(taskGroupPropertyDescriptor, {
  keepLatest: true
});
/**
 * Turns the decorated property into a task group and applies the
 * `restartable` modifier.
 *
 * Optionally takes a hash of further options that will be applied as modifiers
 * to the task group.
 *
 * @function
 * @param {object?} [options={}] Task group modifier options. See {@link task} for list.
 * @return {TaskGroup}
 */

const restartableTaskGroup = createDecorator(taskGroupPropertyDescriptor, {
  restartable: true
});
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/task-properties.js






let taskFactorySymbol = "__ec_task_factory";
const propertyModifiers = {
  /**
   * Configures the task to cancel old currently task instances
   * to make room for a new one to perform. Sets default
   * maxConcurrency to 1.
   *
   * [See the Live Example](/docs/examples/route-tasks/1)
   *
   * @method restartable
   * @memberof TaskProperty
   * @instance
   */
  restartable() {
    this[taskFactorySymbol].setBufferPolicy(restartable_policy);
    return this;
  },

  /**
   * Configures the task to run task instances one-at-a-time in
   * the order they were `.perform()`ed. Sets default
   * maxConcurrency to 1.
   *
   * @method enqueue
   * @memberof TaskProperty
   * @instance
   */
  enqueue() {
    this[taskFactorySymbol].setBufferPolicy(enqueued_policy);
    return this;
  },

  /**
   * Configures the task to immediately cancel (i.e. drop) any
   * task instances performed when the task is already running
   * at maxConcurrency. Sets default maxConcurrency to 1.
   *
   * @method drop
   * @memberof TaskProperty
   * @instance
   */
  drop() {
    this[taskFactorySymbol].setBufferPolicy(drop_policy);
    return this;
  },

  /**
   * Configures the task to drop all but the most recently
   * performed {@linkcode TaskInstance }.
   *
   * @method keepLatest
   * @memberof TaskProperty
   * @instance
   */
  keepLatest() {
    this[taskFactorySymbol].setBufferPolicy(keep_latest_policy);
    return this;
  },

  /**
   * Sets the maximum number of task instances that are allowed
   * to run at the same time. By default, with no task modifiers
   * applied, this number is Infinity (there is no limit
   * to the number of tasks that can run at the same time).
   * {@linkcode TaskProperty#restartable .restartable},
   * {@linkcode TaskProperty#enqueue .enqueue}, and
   * {@linkcode TaskProperty#drop .drop} set the default
   * maxConcurrency to 1, but you can override this value
   * to set the maximum number of concurrently running tasks
   * to a number greater than 1.
   *
   * [See the AJAX Throttling example](/docs/examples/ajax-throttling)
   *
   * The example below uses a task with `maxConcurrency(3)` to limit
   * the number of concurrent AJAX requests (for anyone using this task)
   * to 3.
   *
   * ```js
   * doSomeAjax: task(function * (url) {
   *   return fetch(url);
   * }).maxConcurrency(3),
   *
   * elsewhere() {
   *   this.doSomeAjax.perform("http://www.example.com/json");
   * },
   * ```
   *
   * @method maxConcurrency
   * @memberof TaskProperty
   * @param {Number} n The maximum number of concurrently running tasks
   * @instance
   */
  maxConcurrency(n) {
    this[taskFactorySymbol].setMaxConcurrency(n);
    return this;
  },

  /**
   * Adds this task to a TaskGroup so that concurrency constraints
   * can be shared between multiple tasks.
   *
   * [See the Task Group docs for more information](/docs/task-groups)
   *
   * @method group
   * @memberof TaskProperty
   * @param {String} groupPath A path to the TaskGroup property
   * @instance
   */
  group(taskGroupPath) {
    this[taskFactorySymbol].setGroup(taskGroupPath);
    return this;
  },

  /**
   * Activates lifecycle events, allowing Evented host objects to react to task state
   * changes.
   *
   * ```js
   *
   * export default Component.extend({
   *   uploadTask: task(function* (file) {
   *     // ... file upload stuff
   *   }).evented(),
   *
   *   uploadedStarted: on('uploadTask:started', function(taskInstance) {
   *     this.analytics.track("User Photo: upload started");
   *   }),
   * });
   * ```
   *
   * @method evented
   * @memberof TaskProperty
   * @instance
   */
  evented() {
    this[taskFactorySymbol].setEvented(true);
    return this;
  },

  /**
   * Logs lifecycle events to aid in debugging unexpected Task behavior.
   * Presently only logs cancelation events and the reason for the cancelation,
   * e.g. "TaskInstance 'doStuff' was canceled because the object it lives on was destroyed or unrendered"
   *
   * @method debug
   * @memberof TaskProperty
   * @instance
   */
  debug() {
    this[taskFactorySymbol].setDebug(true);
    return this;
  },

  /**
   * Configures the task to call the passed in callback for derived state updates,
   * overriding the default derived state tracking. You may call with `null` to
   * completely opt-out of derived state tracking.
   *
   * @method onState
   * @memberof TaskProperty
   * @param {function?} callback Callback to be called. Receives an object argument with the new state.
   * @instance
   */
  onState(callback) {
    this[taskFactorySymbol].setOnState(callback);
    return this;
  }

};

function isDecoratorOptions(possibleOptions) {
  if (!possibleOptions) {
    return false;
  }

  if (typeof possibleOptions === "function") {
    return false;
  }

  if (typeof possibleOptions === "object" && 'perform' in possibleOptions && typeof possibleOptions.perform === "function") {
    return false;
  }

  return Object.getPrototypeOf(possibleOptions) === Object.prototype;
}
/**
  A {@link TaskProperty} is the Computed Property-like object returned
  from the {@linkcode task} function. You can call Task Modifier methods
  on this object to configure the behavior of the {@link Task}.

  See [Managing Task Concurrency](/docs/task-concurrency) for an
  overview of all the different task modifiers you can use and how
  they impact automatic cancelation / enqueueing of task instances.

  {@link TaskProperty} is only used for supporting "classic" Ember objects.
  When using Native JavaScript or TypeScript classes, you will use [task decorators](/docs/task-decorators)
  on methods instead.

  @class TaskProperty
  @hideconstructor
*/


let TaskProperty;
let TaskGroupProperty;

if (true) {
  TaskProperty = class {};
  TaskGroupProperty = class {};
} else {}

Object.assign(TaskGroupProperty.prototype, propertyModifiers);
Object.assign(TaskProperty.prototype, propertyModifiers, {
  setup(proto, key) {
    if (this.callSuperSetup) {
      this.callSuperSetup(...arguments);
    }

    this[taskFactorySymbol].setName(key);

    this[taskFactorySymbol]._setupEmberKVO(proto);
  },

  /**
   * Calling `task(...).on(eventName)` configures the task to be
   * automatically performed when the specified events fire. In
   * this way, it behaves like
   * [Ember.on](http://emberjs.com/api/classes/Ember.html#method_on).
   *
   * You can use `task(...).on('init')` to perform the task
   * when the host object is initialized.
   *
   * ```js
   * export default Component.extend({
   *   pollForUpdates: task(function * () {
   *     // ... this runs when the Component is first created
   *     // because we specified .on('init')
   *   }).on('init'),
   *
   *   handleFoo: task(function * (a, b, c) {
   *     // this gets performed automatically if the 'foo'
   *     // event fires on this Component,
   *     // e.g., if someone called component.trigger('foo')
   *   }).on('foo'),
   * });
   * ```
   *
   * [See the Writing Tasks Docs for more info](/docs/writing-tasks)
   *
   * @method on
   * @memberof TaskProperty
   * @param {String} eventNames*
   * @instance
   */
  on() {
    this[taskFactorySymbol].addPerformEvents(...arguments);
    return this;
  },

  /**
   * This behaves like the {@linkcode TaskProperty#on task(...).on() modifier},
   * but instead will cause the task to be canceled if any of the
   * specified events fire on the parent object.
   *
   * [See the Live Example](/docs/examples/route-tasks/1)
   *
   * @method cancelOn
   * @memberof TaskProperty
   * @param {String} eventNames*
   * @instance
   */
  cancelOn() {
    this[taskFactorySymbol].addCancelEvents(...arguments);
    return this;
  },

  /**
   * This behaves like the {@linkcode TaskProperty#on task(...).on() modifier},
   * but instead will cause the task to be performed if any of the
   * specified properties on the parent object change.
   *
   * @method observes
   * @memberof TaskProperty
   * @param {String} keys*
   * @instance
   */
  observes() {
    this[taskFactorySymbol].addObserverKeys(...arguments);
    return this;
  }

});
const setDecorator = Ember._setClassicDecorator || Ember._setComputedDecorator;
function taskComputed(fn) {
  if (true) {
    let cp = function (proto, key) {
      if (cp.setup !== undefined) {
        cp.setup(proto, key);
      }

      return Ember.computed(fn)(...arguments);
    };

    setDecorator(cp);
    return cp;
  } else {}
}
/**
 * A Task is a cancelable, restartable, asynchronous operation that
 * is driven by a generator function. Tasks are automatically canceled
 * when the object they live on is destroyed (e.g. a Component
 * is unrendered).
 *
 * To define a task, use the `task(...)` function, and pass in
 * a generator function, which will be invoked when the task
 * is performed. The reason generator functions are used is
 * that they (like the proposed ES7 async-await syntax) can
 * be used to elegantly express asynchronous, cancelable
 * operations.
 *
 * You can also define an
 * <a href="/docs/encapsulated-task">Encapsulated Task</a>
 * by passing in an object that defined a `perform` generator
 * function property.
 *
 * The following Component defines a task called `myTask` that,
 * when performed, prints a message to the console, sleeps for 1 second,
 * prints a final message to the console, and then completes.
 *
 * ```js
 * import { task, timeout } from 'ember-concurrency';
 * export default Component.extend({
 *   myTask: task(function * () {
 *     console.log("Pausing for a second...");
 *     yield timeout(1000);
 *     console.log("Done!");
 *   })
 * });
 * ```
 *
 * ```hbs
 * <button {{action myTask.perform}}>Perform Task</button>
 * ```
 *
 * By default, tasks have no concurrency constraints
 * (multiple instances of a task can be running at the same time)
 * but much of a power of tasks lies in proper usage of Task Modifiers
 * that you can apply to a task.
 *
 * @param {function} generatorFunction the generator function backing the task.
 * @returns {TaskProperty}
 */

function task_properties_task(taskFnOrProtoOrDecoratorOptions, key, descriptor) {
  if (isDecoratorOptions(taskFnOrProtoOrDecoratorOptions) || key && descriptor) {
    return task(...arguments);
  } else {
    let tp = taskComputed(function () {
      tp[taskFactorySymbol].setTaskDefinition(tp.taskFn);
      return tp[taskFactorySymbol].createTask(this);
    });
    tp.taskFn = taskFnOrProtoOrDecoratorOptions;
    tp[taskFactorySymbol] = new TaskFactory();
    Object.setPrototypeOf(tp, TaskProperty.prototype);
    return tp;
  }
}
/**
 * "Task Groups" provide a means for applying
 * task modifiers to groups of tasks. Once a {@linkcode Task} is declared
 * as part of a group task, modifiers like `drop` or `restartable`
 * will no longer affect the individual `Task`. Instead those
 * modifiers can be applied to the entire group.
 *
 * ```js
 * import { task, taskGroup } from 'ember-concurrency';
 *
 * export default class MyController extends Controller {
 *   @taskGroup({ drop: true }) chores;
 *
 *   @task({ group: 'chores' }) mowLawn = taskFn;
 *   @task({ group: 'chores' }) doDishes = taskFn;
 *   @task({ group: 'chores' }) changeDiapers = taskFn;
 * }
 * ```
 *
 * @returns {TaskGroup}
 */

function task_properties_taskGroup(possibleDecoratorOptions, key, descriptor) {
  if (isDecoratorOptions(possibleDecoratorOptions) || key && descriptor) {
    return taskGroupDecorator(...arguments);
  } else {
    let tp = taskComputed(function (key) {
      tp[taskFactorySymbol].setName(key);
      return tp[taskFactorySymbol].createTaskGroup(this);
    });
    tp[taskFactorySymbol] = new TaskGroupFactory();
    Object.setPrototypeOf(tp, TaskGroupProperty.prototype);
    return tp;
  }
}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/cancelable-promise-helpers.js


/**
 * A cancelation-aware variant of [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).
 * The normal version of a `Promise.all` just returns a regular, uncancelable
 * Promise. The `ember-concurrency` variant of `all()` has the following
 * additional behavior:
 *
 * - if the task that `yield`ed `all()` is canceled, any of the
 *   {@linkcode TaskInstance}s passed in to `all` will be canceled
 * - if any of the {@linkcode TaskInstance}s (or regular promises) passed in reject (or
 *   are canceled), all of the other unfinished `TaskInstance`s will
 *   be automatically canceled.
 *
 * [Check out the "Awaiting Multiple Child Tasks example"](/docs/examples/joining-tasks)
 */

const cancelable_promise_helpers_all = taskAwareVariantOf(Ember.RSVP.Promise, 'all', identity);
/**
 * A cancelation-aware variant of [RSVP.allSettled](https://api.emberjs.com/ember/release/functions/rsvp/allSettled).
 * The normal version of a `RSVP.allSettled` just returns a regular, uncancelable
 * Promise. The `ember-concurrency` variant of `allSettled()` has the following
 * additional behavior:
 *
 * - if the task that `yield`ed `allSettled()` is canceled, any of the
 *   {@linkcode TaskInstance}s passed in to `allSettled` will be canceled
 */

const allSettled = taskAwareVariantOf(Ember.RSVP, 'allSettled', identity);
/**
 * A cancelation-aware variant of [Promise.race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).
 * The normal version of a `Promise.race` just returns a regular, uncancelable
 * Promise. The `ember-concurrency` variant of `race()` has the following
 * additional behavior:
 *
 * - if the task that `yield`ed `race()` is canceled, any of the
 *   {@linkcode TaskInstance}s passed in to `race` will be canceled
 * - once any of the tasks/promises passed in complete (either success, failure,
 *   or cancelation), any of the {@linkcode TaskInstance}s passed in will be canceled
 *
 * [Check out the "Awaiting Multiple Child Tasks example"](/docs/examples/joining-tasks)
 */

const race = taskAwareVariantOf(Ember.RSVP.Promise, 'race', identity);
/**
 * A cancelation-aware variant of [RSVP.hash](https://api.emberjs.com/ember/release/functions/rsvp/hash).
 * The normal version of a `RSVP.hash` just returns a regular, uncancelable
 * Promise. The `ember-concurrency` variant of `hash()` has the following
 * additional behavior:
 *
 * - if the task that `yield`ed `hash()` is canceled, any of the
 *   {@linkcode TaskInstance}s passed in to `hash` will be canceled
 * - if any of the items rejects/cancels, all other cancelable items
 *   (e.g. {@linkcode TaskInstance}s) will be canceled
 */

const hash = taskAwareVariantOf(Ember.RSVP, 'hash', getValues);
/**
 * A cancelation-aware variant of [RSVP.hashSettled](https://api.emberjs.com/ember/release/functions/rsvp/hashSettled).
 * The normal version of a `RSVP.hashSettled` just returns a regular, uncancelable
 * Promise. The `ember-concurrency` variant of `hashSettled()` has the following
 * additional behavior:
 *
 * - if the task that `yield`ed `hashSettled()` is canceled, any of the
 *   {@linkcode TaskInstance}s passed in to `hashSettled` will be canceled
 */

const hashSettled = taskAwareVariantOf(Ember.RSVP, 'hashSettled', getValues);

function identity(obj) {
  return obj;
}

function getValues(obj) {
  return Object.keys(obj).map(k => obj[k]);
}

function taskAwareVariantOf(obj, method, getItems) {
  return function (thing) {
    let items = getItems(thing);
    ( false && 0);
    items.forEach(it => {
      // Mark TaskInstances, including those that performed synchronously and
      // have finished already, as having their errors handled, as if they had
      // been then'd, which this is emulating.
      if (it && it instanceof TaskInstance) {
        it.executor.asyncErrorsHandled = true;
      }
    });
    let defer = Ember.RSVP.defer();
    obj[method](thing).then(defer.resolve, defer.reject);
    let hasCancelled = false;

    let cancelAll = () => {
      if (hasCancelled) {
        return;
      }

      hasCancelled = true;
      items.forEach(it => {
        if (it) {
          if (it instanceof TaskInstance) {
            it.cancel();
          } else if (typeof it[yieldables_cancelableSymbol] === 'function') {
            it[yieldables_cancelableSymbol]();
          }
        }
      });
    };

    let promise = defer.promise.finally(cancelAll);
    promise[yieldables_cancelableSymbol] = cancelAll;
    return promise;
  };
}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/-private/wait-for.js



class WaitForQueueYieldable extends (/* unused pure expression or super */ null && (EmberYieldable)) {
  constructor(queueName) {
    super();
    this.queueName = queueName;
    this.timerId = null;
  }

  [yieldableSymbol](taskInstance, resumeIndex) {
    try {
      this.timerId = Ember.run.schedule(this.queueName, () => {
        taskInstance.proceed(resumeIndex, YIELDABLE_CONTINUE, null);
      });
    } catch (error) {
      taskInstance.proceed(resumeIndex, YIELDABLE_THROW, error);
    }
  }

  [cancelableSymbol]() {
    Ember.run.cancel(this.timerId);
    this.timerId = null;
  }

}

class WaitForEventYieldable extends (/* unused pure expression or super */ null && (EmberYieldable)) {
  constructor(object, eventName) {
    super();
    this.object = object;
    this.eventName = eventName;
    this.fn = null;
    this.didFinish = false;
    this.usesDOMEvents = false;
    this.requiresCleanup = false;
  }

  [yieldableSymbol](taskInstance, resumeIndex) {
    this.fn = event => {
      this.didFinish = true;
      this[cancelableSymbol]();
      taskInstance.proceed(resumeIndex, YIELDABLE_CONTINUE, event);
    };

    if (typeof this.object.addEventListener === "function") {
      // assume that we're dealing with a DOM `EventTarget`.
      this.usesDOMEvents = true;
      this.object.addEventListener(this.eventName, this.fn);
    } else if (typeof this.object.one === 'function') {
      // assume that we're dealing with either `Ember.Evented` or a compatible
      // interface, like jQuery.
      this.object.one(this.eventName, this.fn);
    } else {
      this.requiresCleanup = true;
      this.object.on(this.eventName, this.fn);
    }
  }

  [cancelableSymbol]() {
    if (this.fn) {
      if (this.usesDOMEvents) {
        // unfortunately this is required, because IE 11 does not support the
        // `once` option: https://caniuse.com/#feat=once-event-listener
        this.object.removeEventListener(this.eventName, this.fn);
      } else if (!this.didFinish || this.requiresCleanup) {
        this.object.off(this.eventName, this.fn);
      }

      this.fn = null;
    }
  }

}

class WaitForPropertyYieldable extends (/* unused pure expression or super */ null && (EmberYieldable)) {
  constructor(object, key, predicateCallback = Boolean) {
    super();
    this.object = object;
    this.key = key;

    if (typeof predicateCallback === "function") {
      this.predicateCallback = predicateCallback;
    } else {
      this.predicateCallback = v => v === predicateCallback;
    }

    this.observerBound = false;
  }

  [yieldableSymbol](taskInstance, resumeIndex) {
    this.observerFn = () => {
      let value = Ember.get(this.object, this.key);
      let predicateValue = this.predicateCallback(value);

      if (predicateValue) {
        taskInstance.proceed(resumeIndex, YIELDABLE_CONTINUE, value);
        return true;
      }
    };

    if (!this.observerFn()) {
      Ember.addObserver(this.object, this.key, null, this.observerFn);
      this.observerBound = true;
    }
  }

  [cancelableSymbol]() {
    if (this.observerBound && this.observerFn) {
      Ember.removeObserver(this.object, this.key, null, this.observerFn);
      this.observerFn = null;
    }
  }

}
/**
 * Use `waitForQueue` to pause the task until a certain run loop queue is reached.
 *
 * ```js
 * import { task, waitForQueue } from 'ember-concurrency';
 * export default class MyComponent extends Component {
 *   @task *myTask() {
 *     yield waitForQueue('afterRender');
 *     console.log("now we're in the afterRender queue");
 *   }
 * }
 * ```
 *
 * @param {string} queueName the name of the Ember run loop queue
 */


function waitForQueue(queueName) {
  return new WaitForQueueYieldable(queueName);
}
/**
 * Use `waitForEvent` to pause the task until an event is fired. The event
 * can either be a jQuery event or an Ember.Evented event (or any event system
 * where the object supports `.on()` `.one()` and `.off()`).
 *
 * ```js
 * import { task, waitForEvent } from 'ember-concurrency';
 * export default class MyComponent extends Component {
 *   @task *myTask() {
 *     console.log("Please click anywhere..");
 *     let clickEvent = yield waitForEvent($('body'), 'click');
 *     console.log("Got event", clickEvent);
 *
 *     let emberEvent = yield waitForEvent(this, 'foo');
 *     console.log("Got foo event", emberEvent);
 *
 *     // somewhere else: component.trigger('foo', { value: 123 });
 *   }
 * }
 * ```
 *
 * @param {object} object the Ember Object, jQuery element, or other object with .on() and .off() APIs
 *                 that the event fires from
 * @param {function} eventName the name of the event to wait for
 */

function waitForEvent(object, eventName) {
  ( false && 0);
  return new WaitForEventYieldable(object, eventName);
}
/**
 * Use `waitForProperty` to pause the task until a property on an object
 * changes to some expected value. This can be used for a variety of use
 * cases, including synchronizing with another task by waiting for it
 * to become idle, or change state in some other way. If you omit the
 * callback, `waitForProperty` will resume execution when the observed
 * property becomes truthy. If you provide a callback, it'll be called
 * immediately with the observed property's current value, and multiple
 * times thereafter whenever the property changes, until you return
 * a truthy value from the callback, or the current task is canceled.
 * You can also pass in a non-Function value in place of the callback,
 * in which case the task will continue executing when the property's
 * value becomes the value that you passed in.
 *
 * ```js
 * import { task, waitForProperty } from 'ember-concurrency';
 * export default class MyComponent extends Component {
 *   @tracked foo = 0;
 *
 *   @task *myTask() {
 *     console.log("Waiting for `foo` to become 5");
 *
 *     yield waitForProperty(this, 'foo', v => v === 5);
 *     // alternatively: yield waitForProperty(this, 'foo', 5);
 *
 *     // somewhere else: this.foo = 5;
 *
 *     console.log("`foo` is 5!");
 *
 *     // wait for another task to be idle before running:
 *     yield waitForProperty(this, 'otherTask.isIdle');
 *     console.log("otherTask is idle!");
 *   }
 * }
 * ```
 *
 * @param {object} object an object (most likely an Ember Object)
 * @param {string} key the property name that is observed for changes
 * @param {function} callbackOrValue a Function that should return a truthy value
 *                                   when the task should continue executing, or
 *                                   a non-Function value that the watched property
 *                                   needs to equal before the task will continue running
 */

function waitForProperty(object, key, predicateCallback) {
  return new WaitForPropertyYieldable(object, key, predicateCallback);
}
;// CONCATENATED MODULE: ./node_modules/ember-concurrency/index.js












//# sourceURL=webpack://ec-test/./node_modules/ember-concurrency/index.js_+_38_modules?