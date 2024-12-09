import {defineShape} from '../define-shape/define-shape.js';
import {enumShape, or, unknownShape} from '../define-shape/shape-specifiers.js';

const githubGraphqlErrorShape = defineShape({
    extensions: unknownShape(),
    locations: [{line: 0, column: 0}],
    message: '',
    path: [or('', 0)],
    type: or('', undefined),
});

const githubUserSearchResponseShape = defineShape(
    {
        login: '',
        avatarUrl: or(undefined, ''),
        teamAvatarUrl: or(undefined, ''),
        url: '',
    },
    true,
);

enum GithubMergeableState {
    Mergeable = 'MERGEABLE',
    Conflicting = 'CONFLICTING',
    Unknown = 'UNKNOWN',
}
enum GithubGraphqlCheckRunConclusion {
    ActionRequired = 'ACTION_REQUIRED',
    Cancelled = 'CANCELLED',
    Completed = 'COMPLETED',
    Failure = 'FAILURE',
    InProgress = 'IN_PROGRESS',
    Neutral = 'NEUTRAL',
    Pending = 'PENDING',
    Queued = 'QUEUED',
    Skipped = 'SKIPPED',
    Stale = 'STALE',
    StartupFailure = 'STARTUP_FAILURE',
    Success = 'SUCCESS',
    TimedOut = 'TIMED_OUT',
    Waiting = 'WAITING',
}
enum GithubGraphqlReviewState {
    Approved = 'APPROVED',
    Pending = 'PENDING',
    Commented = 'COMMENTED',
    ChangesRequested = 'CHANGES_REQUESTED',
    Dismissed = 'DISMISSED',
}

const githubRunCheckStateShape = defineShape(
    {
        count: 0,
        state: enumShape(GithubGraphqlCheckRunConclusion),
    },
    true,
);
const githubReviewShape = defineShape(
    {
        state: enumShape(GithubGraphqlReviewState),
        author: githubUserSearchResponseShape,
        submittedAt: '',
    },
    true,
);

const githubPullRequestShape = defineShape(
    {
        additions: 0,
        assignees: {
            nodes: [
                githubUserSearchResponseShape,
            ],
        },
        author: githubUserSearchResponseShape,
        baseRef: {
            name: '',
        },
        bodyText: '',
        mergeable: enumShape(GithubMergeableState),
        headRef: {
            name: '',
        },
        labels: or(
            /** `null` means no labels */
            null,
            {
                nodes: [
                    {
                        name: '',
                        color: '',
                    },
                ],
            },
        ),
        baseRepository: {
            name: '',
            owner: githubUserSearchResponseShape,
            isArchived: false,
            isPrivate: false,
            url: '',
        },
        headRepository: {
            name: '',
            owner: githubUserSearchResponseShape,
            isArchived: false,
            isPrivate: false,
            url: '',
        },
        changedFiles: 0,
        closedAt: or(null, ''),
        commits: {
            nodes: [
                or(
                    /** `null` indicates missing the permissions to read "Contents". */
                    null,
                    {
                        commit: {
                            statusCheckRollup: or(
                                /** `null` indicates lack of permissions to read "Commit statuses". */
                                null,
                                {
                                    contexts: {
                                        checkRunCountsByState: [githubRunCheckStateShape],
                                    },
                                },
                            ),
                        },
                    },
                ),
            ],
            totalCount: 0,
        },
        createdAt: '',
        deletions: 0,
        id: '',
        isDraft: false,
        mergedAt: or(null, ''),
        mergedBy: or(null, githubUserSearchResponseShape),
        number: 0,
        reviewThreads: {
            nodes: [
                {
                    isResolved: false,
                },
            ],
        },
        /**
         * Indicates reviews that have been left. Note that this includes previous reviews from
         * users that currently need to re-review. Compare each of these entries with the
         * `reviewRequests` field before using them.
         */
        latestOpinionatedReviews: {
            nodes: [githubReviewShape],
        },
        /** Indicates requests for review that have not been met. */
        reviewRequests: {
            nodes: [
                {
                    requestedReviewer: githubUserSearchResponseShape,
                },
            ],
        },
        title: '',
        updatedAt: '',
        url: '',
    },
    true,
);

/** `githubSearchShape` from review-vir. */
export const mockBigShape = defineShape(
    {
        errors: [githubGraphqlErrorShape],
        data: {
            rateLimit: {
                cost: 1,
                limit: 5000,
                nodeCount: 0,
                remaining: 0,
                resetAt: '',
                used: 0,
            },
            viewer: githubUserSearchResponseShape,
            search: {
                issueCount: 0,
                pageInfo: {
                    endCursor: or('', null),
                    hasNextPage: false,
                },
                nodes: [
                    githubPullRequestShape,
                ],
            },
        },
    },
    true,
);
