---
id: facematch-accuracy
title: FaceMatch Accuracy
sidebar_label: FaceMatch Accuracy
---

# FaceMatch Accuracy

What Private FaceMatch measures, how it decides, which models it uses, and what their published accuracy is. Written for integration and compliance reviews. For how to request a FaceMatch, see the [Private FaceMatch example](./examples/facematch).

## What FaceMatch checks

The app takes a short camera scan of the user's face and compares it with the photo stored on the chip of their ID. It answers one question:

> Is the person holding the phone the same person as the photo on this ID?

This is a **one-to-one** comparison against a single reference photo — the one on the user's own document. It is not a search. FaceMatch never compares the user against a database of other people, and ZKPassport holds no such database.

This distinction matters when reading a biometric vendor questionnaire. Most of them ask for *identification* metrics — FPIR and FNIR at a given gallery size — which describe searching one face against many enrolled identities. Those metrics do not apply to ZKPassport.

| | Identification (1:N) | Verification (1:1) |
| --- | --- | --- |
| Question | Who is this person? | Is this the same person? |
| Compared against | A gallery of many enrolled faces | One photo, from this user's own ID |
| Usual metrics | FPIR / FNIR at a stated gallery size | FMR / FNMR, or TAR at a fixed FAR |
| Used by ZKPassport | No | Yes |

## How the decision is made

1. A detector model finds the face in each camera frame.
2. A recognition model turns that face into a **faceprint** — a list of 512 numbers describing the face, not an image.
3. The same is done once for the photo read off the chip.
4. The two faceprints are compared. The result is a similarity score.
5. Frames scoring above the threshold count towards completion. The app averages them into the final score.

| Parameter | Value |
| --- | --- |
| Comparison | Cosine similarity between two 512-number faceprints |
| Score range | −1 to 1 — higher means more similar |
| A frame counts when | score **> 0.50** |
| Final decision | average of the counted frames **≥ 0.50** |
| Frames averaged | up to 10 |
| Threshold configurable | No. Fixed in the app, identical for every integrator |
| Result reuse | Up to 30 days per ID and per mode, after which a new scan is required |

0.50 is a deliberately conservative setting. A higher threshold makes it harder for the wrong person to pass and easier for the right person to be turned away; a lower one does the reverse. In practice this means a poor scan — bad lighting, glare, a face too far from the camera — fails and has to be retried, rather than quietly passing.

## Liveness checks

A face comparison on its own can be fooled by holding a printed photo or a screen in front of the camera. So the app also checks that it is looking at a live person. Both modes keep matching every frame against the ID photo while the check runs.

| | `regular` | `strict` (default) |
| --- | --- | --- |
| What the user does | Looks at the camera | Looks at the camera, then left, up, right and down |
| How it completes | Several matching frames while facing the camera | Matching frames at the camera, then at each of the four directions |
| Speed | Faster | Slower |
| Suited to | Low-risk flows | KYC and anything where the result carries weight |

:::info
This is an **active** liveness check: the app issues a challenge and verifies the face follows it. ZKPassport does not run a separate passive presentation-attack-detection (PAD) model, and this check has not been evaluated under ISO/IEC 30107-3 by an accredited laboratory. If your compliance process requires a certified PAD level, treat this as an open item and [get in touch](https://zkpassport.id).
:::

## The models

Both models run entirely on the phone and are downloaded once, on first use.

| Role | Model | Source | Size |
| --- | --- | --- | --- |
| Find the face in the frame | SCRFD-2.5GF | [InsightFace](https://github.com/deepinsight/insightface) | 3.4 MB |
| Turn a face into a faceprint | ArcFace ResNet-50, trained on WebFace600K | [InsightFace `buffalo_l`](https://github.com/deepinsight/insightface/blob/master/python-package/docs/model_zoo.md) (`w600k_r50`, release v0.7) | 43.8 MB |

The recognition model is the one InsightFace publishes, with its weights stored in 8 bits instead of 32 to keep the download small. The calculations themselves are unchanged — see [How these figures relate to our build](#how-these-figures-relate-to-our-build).

## Published accuracy of the recognition model

These are the figures InsightFace publishes for this model. They describe the model as released; they are not measurements of ZKPassport's end-to-end flow, which adds the liveness check, the multi-frame average and the fixed 0.50 threshold.

### Standard benchmarks

| Benchmark | What it tests | Score |
| --- | --- | --- |
| LFW | Everyday photos — same person or not | 99.83 % |
| CFP-FP | One photo from the front, one from the side | 99.33 % |
| AgeDB-30 | The same person photographed up to 30 years apart | 98.23 % |
| IJB-C (E4) | Hard real-world photos and video frames | 97.25 % |

### A much harder test, broken down by region

InsightFace also reports results on IFRT, its own large-scale test: 1.6 million images of 242,143 people, judged at a very strict setting — at most **one wrong pair accepted in a million**. The score is the share of genuine pairs the model still recognises at that setting. This is far stricter than anything ZKPassport runs at, which is why the numbers are lower.

| Group | Score |
| --- | --- |
| All groups | 91.25 % |
| Caucasian | 94.70 % |
| South Asian | 93.16 % |
| African | 90.29 % |
| East Asian | 74.96 % |

:::info
These are not ZKPassport pass rates and should not be read as one. IFRT compares every image against every other at a setting far stricter than a one-to-one check against your own passport photo, so the figures say how the model ranks under maximum pressure, not how often a user completes a FaceMatch.

What they do show is that performance is not uniform across groups, with the East Asian figure the clear outlier. The gap is real, and we have not measured it at our own threshold. Teams with obligations around demographic performance should factor this in and offer a fallback for users who cannot complete a FaceMatch.
:::

### How these figures relate to our build

The figures above were measured on the model as InsightFace released it, with 32-bit weights. ZKPassport ships the same model with its weights stored in 8 bits, which keeps the download small; the arithmetic is unchanged.

Two peer-reviewed studies measure what 8-bit storage costs on this architecture. Both compress more aggressively than we do — they round the calculations as well as the weights — so they bound the difference rather than describe it:

- [QuantFace (ICPR 2022)](https://arxiv.org/abs/2206.10526) finds every benchmark within 0.31 points of full precision, and most within 0.1 — LFW 99.80 % → 99.78 %, IJB-C 95.74 % → 95.66 %.
- [Neto et al. (BIOSIG 2023)](https://arxiv.org/abs/2308.11840) finds no measurable change for any ethnic group on RFW: all four groups within ±0.1 points, in both directions.

## What has not been measured

Stated plainly, so it does not have to be inferred:

- **No independent laboratory evaluation.** InsightFace models are not submitted to NIST FRTE, so no NIST figures exist for this model or for ZKPassport's build of it.
- **No ZKPassport study on chip photos.** The published benchmarks use photos from the web. Chip photos are different: passport-style, sometimes a decade old, and stored at low resolution. We have not published our own FMR/FNMR figures on that kind of image.
- **No certified PAD testing**, as noted under [Liveness checks](#liveness-checks).
- **The 8-bit evidence is indirect.** Both papers test the same architecture and loss, but a model trained on a different dataset (MS1MV2, not WebFace600K). It is strong evidence, not a measurement of the exact file we ship.

## What leaves the device, and what you receive

Camera frames, the chip photo and the faceprints stay on the phone. None of them are transmitted to ZKPassport or to you, and none of them are kept once the scan finishes.

What the phone does keep, to allow the [30-day reuse](#how-the-decision-is-made) above, is the signed result itself: the mode, the score, the threshold, and hashes of the chip photo and the faceprint. It holds no image and no faceprint, and it never leaves the device.

Your server receives a zero-knowledge proof and `result.facematch.passed` — a single pass or fail. To make that trustworthy, the app binds the outcome to the device and to the document:

- The scan result is signed by **Apple App Attest** or **Google Play Integrity**, so you can tell it ran on a device that passes Apple's or Google's integrity checks. The app refuses to produce a FaceMatch on devices these services do not vouch for — see [Limitations](./limitations#facematch-support).
- The mode used, the final score, the threshold and a hash of the chip photo are all sealed into that signed attestation, and from there into the proof. Because the mode and the document are covered by the signature, a result cannot be re-presented as a different mode or against a different document.
