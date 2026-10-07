---
id: facematch-accuracy
title: FaceMatch Accuracy
---

# FaceMatch Accuracy

How Private FaceMatch compares a face to an ID photo, how accurate the models behind it are, and what has and has not been tested. Written for integration and compliance reviews. For how to request a FaceMatch, see the [Private FaceMatch example](./examples/facematch).

## What FaceMatch checks

The app takes a short camera scan of the user's face and compares it with the photo stored on the chip of their ID. It answers one question:

> Is the person holding the phone the same person as the photo on this ID?

That is a one-to-one check — the kind your phone does when it unlocks on seeing your face. It is not a search. There is no collection of faces anywhere in ZKPassport, and the single photo FaceMatch compares against is read off the user's own chip, seconds earlier.

The distinction matters when filling in a biometric questionnaire. Those are usually written for face *search* systems — **identification**, or 1:N — and ask for **FPIR** and **FNIR** at a given "gallery size", which have no answer here because there is no gallery. The measures that fit a one-to-one check — **verification**, or 1:1 — are **FMR**, how often the wrong person is let in, and **FNMR**, how often the right person is turned away.

## How the decision is made

1. A detector model finds the face in each camera frame.
2. A recognition model turns that face into a **faceprint** — a list of 512 numbers describing the face, not an image.
3. The same is done once for the photo read off the chip.
4. The two faceprints are compared. The result is a similarity score.
5. Frames scoring above the threshold count towards completion. The app averages them into the final score.

| Parameter | Value |
| --- | --- |
| Reference photo | The portrait on the ID's chip, recorded by the issuing authority to the ICAO 9303 standard |
| Comparison | Cosine similarity — a standard way of measuring how alike two faceprints are |
| Score range | −1 to 1 — higher means more similar |
| A frame counts when | score **> 0.50** |
| Final decision | average of the counted frames **≥ 0.50** |
| Frames averaged | up to 10 |
| Threshold configurable | No — the same value for every integrator |
| Result reuse | Up to 30 days per ID and per mode, after which a new scan is required |

A threshold of 0.50 is deliberately conservative. A higher one makes it harder for the wrong person to pass and easier for the right person to be turned away; a lower one does the reverse. In practice this means a poor scan — bad lighting, glare, a face too far from the camera — fails and has to be retried, rather than quietly passing.

## Liveness checks

A face comparison on its own can be fooled by holding a printed photo or a screen in front of the camera. So the app also checks that it is looking at a live person. Both modes keep matching every frame against the ID photo while the check runs.

| | `regular` | `strict` (default) |
| --- | --- | --- |
| What the user does | Looks at the camera | Looks at the camera, then left, up, right and down |
| How it completes | Several matching frames while facing the camera | Matching frames at the camera, then at each of the four directions |
| Speed | Faster | Slower |
| Suited to | Low-risk flows | KYC and anything where the result carries weight |

:::info
This is an **active** liveness check: the app issues a challenge and verifies the face follows it. There is no separate liveness score to set a threshold on — the user either completes the challenge within the scan or the scan fails. ZKPassport does not run a separate passive presentation-attack-detection (PAD) model, and this check has not been evaluated under ISO/IEC 30107-3 by an accredited laboratory. If your compliance process requires a certified PAD level, treat this as an open item and [get in touch](https://zkpassport.id).
:::

## The models

Both models come from [InsightFace](https://github.com/deepinsight/insightface), run entirely on the phone, and are downloaded once on first use.

| Role | Model | Size |
| --- | --- | --- |
| Find the face in the frame | SCRFD-2.5GF | 3.4 MB |
| Turn it into a faceprint | ArcFace ResNet-50, trained on WebFace600K | 43.8 MB |

The recognition model is InsightFace's [`buffalo_l`](https://github.com/deepinsight/insightface/blob/master/python-package/docs/model_zoo.md) release (`w600k_r50`, v0.7), with its weights stored in 8 bits instead of 32 to keep the download small. The calculations themselves are unchanged — see [How these figures relate to our build](#how-these-figures-relate-to-our-build).

## Published accuracy of the recognition model

These are the figures InsightFace publishes for this model. They describe the model as released; they are not measurements of ZKPassport's end-to-end flow, which adds the liveness check, the multi-frame average and the fixed 0.50 threshold.

### Standard benchmarks

| Benchmark | What it tests | Comparisons | Score |
| --- | --- | --- | --- |
| LFW | Everyday photos — same person or not | 6,000 pairs | 99.83 % |
| CFP-FP | One photo from the front, one from the side | 7,000 pairs | 99.33 % |
| AgeDB-30 | The same person photographed up to 30 years apart | 6,000 pairs | 98.23 % |
| IJB-C (E4) | Hard real-world photos and video frames | 19.6k genuine, 15.6M impostor | 97.25 % |

These counts matter when reading small differences. LFW is 6,000 pairs, so one wrong pair moves the score by about 0.017 points — a gap of a few hundredths means one or two pairs, not a real difference.

### A much harder test, broken down by group

InsightFace also reports results on IFRT, its own large-scale test: 242,143 people, every image compared against every other, at a setting that accepts at most **one wrong pair in a million**. The score is the share of genuine pairs the model still recognises. It is far stricter than anything ZKPassport runs at, which is why these numbers are lower than the ones above.

| Group | Images tested | Score |
| --- | --- | --- |
| All groups | 1,624,305 | 91.25 % |
| Caucasian | 697,245 | 94.70 % |
| South Asian | 237,080 | 93.16 % |
| African | 298,010 | 90.29 % |
| East Asian | 391,970 | 74.96 % |

:::info
These are not ZKPassport pass rates and should not be read as such. IFRT compares every image against every other at a setting far stricter than a one-to-one check against your own passport photo, so the figures say how the model ranks under maximum pressure, not how often a user completes a FaceMatch.

What they do show is that performance is not uniform across groups, with the East Asian figure the clear outlier. The gap is real — it is measured over 391,970 images, so it is not a small-sample artefact — and we have not measured it at our own threshold. Teams with obligations around demographic performance should factor this in and offer a fallback for users who cannot complete a FaceMatch.
:::

### How these figures relate to our build

The figures above were measured on InsightFace's release, which stores its weights in 32 bits. ZKPassport ships the same model with 8-bit weights.

Two peer-reviewed studies measure what 8-bit storage costs on this architecture. Both compress more aggressively than we do — they round the calculations as well as the weights — so they bound the difference rather than describe it:

- [QuantFace (ICPR 2022)](https://arxiv.org/abs/2206.10526) finds every benchmark within 0.31 points of full precision, and most within 0.1 — LFW 99.80 % → 99.78 %, IJB-C 95.74 % → 95.66 %.
- [Neto et al. (BIOSIG 2023)](https://arxiv.org/abs/2308.11840) finds no measurable change for any ethnic group on RFW (6,000 pairs per group): all four within ±0.1 points, in both directions.

## What has not been measured

Stated plainly, rather than left to be inferred:

- **No independent laboratory evaluation.** InsightFace models are not submitted to NIST FRTE, so no NIST figures exist for this model or for ZKPassport's build of it.
- **No ZKPassport study on chip photos.** The published benchmarks use photos from the web. Chip photos are different: passport-style, sometimes a decade old, and stored at low resolution. We have no published figures of our own for that kind of image.
- **No certified PAD testing**, as noted under [Liveness checks](#liveness-checks).
- **The 8-bit evidence is indirect.** Both papers test the same architecture and loss, but a model trained on a different dataset (MS1MV2, not WebFace600K). It is strong evidence, not a measurement of the exact file we ship.

## What stays on the phone, and what you receive

Camera frames, the chip photo and the faceprints stay on the phone. None of them are transmitted to ZKPassport or to you, and none of them are kept once the scan finishes.

What the phone does keep, to allow the [30-day reuse](#how-the-decision-is-made) above, is the signed result itself: the mode, the score, the threshold, and hashes of the chip photo and the faceprint. It holds no image and no faceprint, and it never leaves the device.

Your server receives a zero-knowledge proof and `result.facematch.passed` — a single pass or fail. To make that trustworthy, the app binds the outcome to the device and to the document:

- The scan result is signed by **Apple App Attest** or **Google Play Integrity**, so you can tell it ran on a device that passes those checks. The app refuses to produce a FaceMatch on devices these services do not vouch for — see [Limitations](./limitations#facematch-support).
- The mode used, the final score, the threshold and a hash of the chip photo are all sealed into that signed attestation, and from there into the proof. Because the mode and the document are covered by the signature, a result cannot be re-presented as a different mode or against a different document.
