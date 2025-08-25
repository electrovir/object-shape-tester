import {Type} from '@sinclair/typebox';

const githubGraphqlErrorShape = Type.Object({
    extensions: Type.Unknown(),
    locations: Type.Array(
        Type.Object({
            line: Type.Number(),
            column: Type.Number(),
        }),
    ),
    message: Type.String(),
    path: Type.Array(
        Type.Union([
            Type.String(),
            Type.Number(),
        ]),
    ),
    type: Type.Optional(Type.String()),
});

const githubUserSearchResponseShape = Type.Object({
    login: Type.String(),
    avatarUrl: Type.Optional(Type.String()),
    teamAvatarUrl: Type.Optional(Type.String()),
    url: Type.String(),
});

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

const githubRunCheckStateShape = Type.Object({
    count: Type.Number(),
    state: Type.Enum(GithubGraphqlCheckRunConclusion),
});
const githubReviewShape = Type.Object({
    state: Type.Enum(GithubGraphqlReviewState),
    author: githubUserSearchResponseShape,
    submittedAt: Type.String(),
});

const githubPullRequestShape = Type.Object({
    additions: Type.Number(),
    assignees: Type.Object({
        nodes: Type.Array(githubUserSearchResponseShape),
    }),
    author: githubUserSearchResponseShape,
    baseRef: Type.Object({
        name: Type.String(),
    }),
    bodyText: Type.String(),
    mergeable: Type.Enum(GithubMergeableState),
    headRef: Type.Object({
        name: Type.String(),
    }),
    labels: Type.Union([
        /** `null` means no labels */
        Type.Null(),
        Type.Object({
            nodes: Type.Array(
                Type.Object({
                    name: Type.String(),
                    color: Type.String(),
                }),
            ),
        }),
    ]),
    baseRepository: Type.Object({
        name: Type.String(),
        owner: githubUserSearchResponseShape,
        isArchived: Type.Boolean(),
        isPrivate: Type.Boolean(),
        url: Type.String(),
    }),
    headRepository: Type.Object({
        name: Type.String(),
        owner: githubUserSearchResponseShape,
        isArchived: Type.Boolean(),
        isPrivate: Type.Boolean(),
        url: Type.String(),
    }),
    changedFiles: Type.Number(),
    closedAt: Type.Union([
        Type.Null(),
        Type.String(),
    ]),
    commits: Type.Object({
        nodes: Type.Array(
            Type.Union([
                /** `null` indicates missing the permissions to read "Contents". */
                Type.Null(),
                Type.Object({
                    commit: Type.Object({
                        statusCheckRollup: Type.Union([
                            /** `null` indicates lack of permissions to read "Commit statuses". */
                            Type.Null(),
                            Type.Object({
                                contexts: Type.Object({
                                    checkRunCountsByState: Type.Array(githubRunCheckStateShape),
                                }),
                            }),
                        ]),
                    }),
                }),
            ]),
        ),
        totalCount: Type.Number(),
    }),
    createdAt: Type.String(),
    deletions: Type.Number(),
    id: Type.String(),
    isDraft: Type.Boolean(),
    mergedAt: Type.Union([
        Type.Null(),
        Type.String(),
    ]),
    mergedBy: Type.Union([
        Type.Null(),
        githubUserSearchResponseShape,
    ]),
    number: Type.Number(),
    reviewThreads: Type.Object({
        nodes: Type.Array(
            Type.Object({
                isResolved: Type.Boolean(),
            }),
        ),
    }),
    /**
     * Indicates reviews that have been left. Note that this includes previous reviews from users
     * that currently need to re-review. Compare each of these entries with the `reviewRequests`
     * field before using them.
     */
    latestOpinionatedReviews: Type.Object({
        nodes: Type.Array(githubReviewShape),
    }),
    /** Indicates requests for review that have not been met. */
    reviewRequests: Type.Object({
        nodes: Type.Array(
            Type.Object({
                requestedReviewer: githubUserSearchResponseShape,
            }),
        ),
    }),
    title: Type.String(),
    updatedAt: Type.String(),
    url: Type.String(),
});

/** `githubSearchShape` from review-vir. */
export const mockBigType = Type.Object({
    errors: Type.Array(githubGraphqlErrorShape),
    data: Type.Object({
        rateLimit: Type.Object({
            cost: Type.Number(),
            limit: Type.Number(),
            nodeCount: Type.Number(),
            remaining: Type.Number(),
            resetAt: Type.String(),
            used: Type.Number(),
        }),
        viewer: githubUserSearchResponseShape,
        search: Type.Object({
            issueCount: Type.Number(),
            pageInfo: Type.Object({
                endCursor: Type.Union([
                    Type.String(),
                    Type.Null(),
                ]),
                hasNextPage: Type.Boolean(),
            }),
            nodes: Type.Array(githubPullRequestShape),
        }),
    }),
});
