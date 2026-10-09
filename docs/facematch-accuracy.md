---
id: facematch-accuracy
title: Private FaceMatch Technical Note
---

# Private FaceMatch Technical Note

This page describes how Private FaceMatch works, which models it uses, how accurate those models are, and what has not been measured. It is written for integration, compliance and regulatory reviews. For how to request a FaceMatch in your integration, see the [Private FaceMatch example](./examples/facematch).

| | |
| --- | --- |
| Provider | ZKPassport |
| Product | Private FaceMatch, part of the ZKPassport mobile app |
| App version described | 1.5.0 |
| Face detection model | SCRFD-2.5G-KPS (InsightFace) |
| Face recognition model | ArcFace, IResNet-50, trained on WebFace600K (InsightFace `buffalo_l` v0.7, `w600k_r50`), shipped with 8-bit weights |
| Last updated | October 2026 |

## What Private FaceMatch does

Private FaceMatch answers one question: is the person holding the phone the same person as the one in the photo stored on the chip of their ID?

It is a one-to-one comparison (face verification), not a search of a database (face identification). The reference photo is read from the chip of the user's passport or ID card during the NFC scan, and the ID's own cryptographic signature covers that photo. The live face is captured from the phone camera. Both are compared on the phone and the only output that leaves the device is a zero-knowledge proof carrying a single pass or fail.

### How it differs from a hosted face verification service

| | Private FaceMatch | Typical hosted service |
| --- | --- | --- |
| Reference image | Portrait on the ID chip, written by the issuing authority and covered by the document signature | A selfie, a scan of the document photo page, or a stored enrollment template |
| Where the comparison runs | On the user's phone | On the vendor's servers |
| What the verifier receives | A zero-knowledge proof and a boolean `passed` | Images, templates, similarity scores, or a vendor API response |
| Biometric data retained | None. Camera frames, the chip photo and the faceprints are discarded when the scan ends | Often retained by the vendor or the integrator |
| Gallery | None. There is no database of enrolled faces anywhere in ZKPassport | Usually one per integrator |
| Threshold | Fixed by ZKPassport, identical for every integrator | Configurable per integrator |
| Proof of origin | Apple App Attest or Android Key Attestation and Play Integrity, verified inside the proof | Vendor trust |

### Answering identification questionnaires

Many biometric questionnaires are written for identification systems (1:N) and ask for FPIR and FNIR at a given gallery size. Those metrics do not apply to Private FaceMatch because there is no gallery. The measures that describe a one-to-one comparison are:

- **FMR (False Match Rate)**: how often two different people are accepted as the same person.
- **FNMR (False Non-Match Rate)**: how often the same person is rejected.

These follow ISO/IEC 19795-1. The published figures further down use the equivalent terms TAR (True Accept Rate, equal to 1 − FNMR) and FAR (False Accept Rate, equal to FMR).

## How a scan works

1. The app reads the portrait from the chip (data group 2) during the NFC scan and runs it through the same detector and recognition model as the camera frames, producing the reference faceprint.
2. The front camera streams frames at 640×480. On each frame the detector finds the largest face and its five landmarks (eyes, nose, mouth corners).
3. The face is aligned to a 112×112 crop from those landmarks and the recognition model turns it into a faceprint: a vector of 512 numbers. The faceprint is not an image and cannot be turned back into one.
4. The frame faceprint is compared with the reference faceprint using cosine similarity. A frame counts as a match when its score is above the threshold.
5. The scan completes once the head-movement challenge is done and enough frames have matched. The scores of the matching frames are averaged into the final score.
6. The phone's attestation service signs the outcome, and the app produces a zero-knowledge proof over that signature.

| Parameter | Value |
| --- | --- |
| Reference image | ICAO 9303 portrait from the ID chip (data group 2) |
| Probe images | Live camera frames, 640×480, up to 30 per second; a faceprint is computed for every second detected face |
| Face detection | SCRFD-2.5G-KPS, detection score at least 0.3, largest detected face is used |
| Alignment | Similarity transform of the five landmarks to the ArcFace reference positions, 112×112 crop |
| Faceprint | 512-dimensional ArcFace embedding, L2-normalised |
| Comparison | Cosine similarity of the two faceprints |
| Score range | −1 to 1, higher means more similar |
| Per-frame match rule | score strictly greater than 0.50 |
| Frames required | 10 matching frames: 2 facing the camera, then 2 at each of the four prompted head directions |
| Final score | Mean of the 10 matching frames' scores, recorded in the attestation together with the threshold |
| Timeout | 60 seconds without a matching frame ends the scan; the user can retry |
| Decision unit | One scan session, per ID |
| Result reuse | A completed scan is reusable for 30 days for the same ID, after which a new scan is required |

### Matching threshold

| | |
| --- | --- |
| Default threshold | 0.50 cosine similarity |
| Configurable by the integrator | No. Every integrator gets the same threshold |
| Treatment of equality | A frame scoring exactly 0.50 does not count |
| How it was chosen | Fixed by ZKPassport on the conservative side of the range commonly used with ArcFace models. Raising it makes it harder for a different person to pass and easier for the right person to be rejected; lowering it does the opposite |
| Failure behaviour | A poor capture (bad lighting, glare, face too far away, strong head tilt) produces frames that do not match. They are not counted and the scan keeps going until it times out. The user is told to retry |

ZKPassport has not measured FMR and FNMR at this threshold on ID chip photos. See [What has not been measured](#what-has-not-been-measured).

## Liveness

A face comparison on its own can be fooled by holding a printed photo or a screen in front of the camera. Private FaceMatch therefore combines the comparison with an active head-movement challenge.

| | |
| --- | --- |
| What the user does | Looks at the camera, then turns their head left, up, right and down when prompted |
| Frames collected | 2 matching frames facing the camera, then 2 matching frames at each of the four directions, 10 in total |
| Head-movement check | Each turned frame must have the head pose within 35° of the requested direction and turned far enough to be unambiguous, and must still match the ID photo above the threshold |
| Protection | A printed photo cannot follow the prompts. A replayed video has to show the right person turning in the requested order while staying above the threshold on every counted frame |
| Duration | Typically 10 to 20 seconds |

The head pose is estimated from the five landmarks returned by the detector, so the challenge uses no additional model.

| | |
| --- | --- |
| Type of liveness | Active (challenge-response). The app issues head-movement prompts and verifies that the detected face follows them while continuing to match the ID photo |
| Passive presentation attack detection (PAD) model | None |
| Liveness score and threshold | None. The challenge is either completed within the session or the scan times out |
| Inconclusive results | A scan that times out produces no result. Nothing is recorded or attested |
| Decision unit | Per scan session |
| ISO/IEC 30107-3 evaluation | Not performed. No accredited laboratory has tested Private FaceMatch for presentation attack detection, and no APCER/BPCER figures exist |

If your compliance process requires a certified PAD level, treat this as an open item and [get in touch](https://zkpassport.id).

## The models

Both models come from the open-source [InsightFace](https://github.com/deepinsight/insightface) project. They run entirely on the phone through ONNX Runtime (using Core ML on iOS) and are downloaded from ZKPassport's CDN on first use.

| Role | Model | Architecture | Training data | Download size |
| --- | --- | --- | --- | --- |
| Face detection and landmarks | SCRFD-2.5G-KPS ([Guo et al., ICLR 2022](https://arxiv.org/abs/2105.04714)) | 0.82M parameters, 2.5 GFLOPs at VGA | WIDER FACE | 3.4 MB |
| Face recognition | ArcFace `w600k_r50` from the `buffalo_l` v0.7 model pack ([Deng et al., CVPR 2019](https://arxiv.org/abs/1801.07698)) | IResNet-50, 512-dimensional output | WebFace600K, a 600,000-identity subset of WebFace260M | 43.8 MB |

The recognition model is InsightFace's release with its weights stored in 8 bits instead of 32 (one scale per output channel). ONNX Runtime restores 32-bit weights when it loads the model, so the arithmetic is otherwise unchanged. The effect of this on accuracy is discussed under [Effect of the 8-bit weights](#effect-of-the-8-bit-weights).

## Published accuracy of the recognition model

These are the figures InsightFace publishes for the `buffalo_l` recognition model. They describe the model as released, in 32-bit precision, on public and InsightFace-internal benchmarks. They are not measurements of ZKPassport's end-to-end flow.

### Standard verification benchmarks

| Benchmark | What it tests | Comparisons | Result |
| --- | --- | --- | --- |
| LFW | Unconstrained web photos, same person or not | 6,000 pairs | 99.83 % accuracy |
| CFP-FP | Frontal photo against a profile photo of the same person | 7,000 pairs | 99.33 % accuracy |
| AgeDB-30 | Photos of the same person taken up to 30 years apart | 6,000 pairs | 98.23 % accuracy |
| IJB-C | Mixed-quality stills and video frames, verification protocol | 19,557 genuine and 15,638,932 impostor comparisons | 97.25 % TAR at FAR = 0.01 % |

Accuracy on the pair benchmarks is the share of pairs classified correctly at the best threshold for that benchmark. With 6,000 pairs, a single pair moves the result by about 0.017 points, so differences of a few hundredths between models are within noise. The IJB-C figure is read differently: at an operating point where 1 impostor comparison in 10,000 is wrongly accepted, 97.25 % of genuine comparisons are accepted (FNMR of 2.75 %).

### Results by demographic group

InsightFace also evaluates its models on a private multi-racial test set (the "MR" set of the InsightFace Recognition Test). Every image is compared with every other image, and the reported figure is the share of genuine pairs accepted at a threshold where no more than 1 impostor pair in 1,000,000 is accepted (TAR at FAR = 0.0001 %). This is a far stricter operating point than any single-document check, which is why the numbers are lower than the ones above.

| Group | Identities | Images | Genuine pairs | Impostor pairs | TAR at FAR = 1e-6 |
| --- | --- | --- | --- | --- | --- |
| All groups | 242,143 | 1,624,305 | 4,689,037 | 2,638,360,419,683 | 91.25 % |
| Caucasian | 103,293 | 697,245 | 2,024,609 | 486,147,868,171 | 94.70 % |
| South Asian | 35,086 | 237,080 | 688,259 | 56,206,001,061 | 93.16 % |
| African | 43,874 | 298,010 | 870,091 | 88,808,791,999 | 90.29 % |
| East Asian | 59,890 | 391,970 | 1,106,078 | 153,638,982,852 | 74.96 % |

:::info
These are not pass rates for Private FaceMatch. They show how the model ranks under a one-in-a-million false accept constraint across a very large test set, not how often a user completes a scan against their own ID photo at a 0.50 threshold.

What they do show is that the model's performance is not uniform across groups. The East Asian figure is a clear outlier, and because it is measured over 391,970 images and more than a million genuine pairs it is not a small-sample effect. ZKPassport has not measured how this gap translates to its own threshold and reference images. Integrators with obligations around demographic performance should take this into account and offer a fallback path for users who cannot complete a FaceMatch.
:::

### Detection model

SCRFD-2.5G-KPS reports an average precision of 93.80 % (easy), 92.02 % (medium) and 77.13 % (hard) on the WIDER FACE validation set at VGA resolution. Private FaceMatch operates in the easy regime: one cooperative face, close to the camera, in a portrait frame. A frame where no face is detected is simply not counted.

## Effect of the 8-bit weights

The published figures above were measured on the 32-bit release. ZKPassport ships the same model with its weights rounded to 8 bits to cut the download from 175 MB to 44 MB. Activations and all arithmetic stay in 32-bit floating point.

ZKPassport has not run the public benchmarks on the 8-bit file. Two peer-reviewed studies measure a more aggressive form of 8-bit quantisation on the same architecture and loss (IResNet-50 with ArcFace, trained on MS1MV2). Both quantise the activations as well as the weights and retrain the model afterwards, so they bound the effect rather than measure the exact file ZKPassport ships.

[QuantFace (Boutros et al., ICPR 2022)](https://arxiv.org/abs/2206.10526), ResNet-50, 32-bit versus 8-bit weights and activations:

| Benchmark | 32-bit | 8-bit | Change |
| --- | --- | --- | --- |
| LFW | 99.80 % | 99.78 % | −0.02 |
| CFP-FP | 98.01 % | 97.70 % | −0.31 |
| AgeDB-30 | 98.08 % | 98.00 % | −0.08 |
| CALFW | 96.10 % | 96.00 % | −0.10 |
| CPLFW | 92.43 % | 92.17 % | −0.26 |
| IJB-C (TAR at FAR = 1e-4) | 95.74 % | 95.66 % | −0.08 |
| IJB-B (TAR at FAR = 1e-4) | 94.19 % | 94.15 % | −0.04 |

[Neto et al. (BIOSIG 2023)](https://arxiv.org/abs/2308.11840), same ResNet-50, evaluated per ethnicity on RFW (6,000 pairs per group):

| Group | 32-bit | 8-bit | Change |
| --- | --- | --- | --- |
| Caucasian | 99.00 % | 99.07 % | +0.07 |
| South Asian | 98.15 % | 98.07 % | −0.08 |
| East Asian | 97.62 % | 97.65 % | +0.03 |
| African | 98.32 % | 98.40 % | +0.08 |

Both studies find the 8-bit model within a third of a point of the 32-bit model on every benchmark, and the per-group differences are within the noise of a 6,000-pair test. The quantisation they apply is stricter than ZKPassport's, so the effect on the shipped model is expected to be smaller still.

## What has not been measured

The following items are usually requested in accuracy questionnaires and are not available for Private FaceMatch today.

- **FMR and FNMR of the end-to-end flow.** ZKPassport has not run a controlled study of the full scan (chip photo as reference, phone camera as probe, 0.50 threshold, multi-frame averaging). The published benchmarks use web photos, while chip photos are passport-style portraits that can be up to ten years old and are stored at low resolution.
- **Demographic breakdown at the operating threshold.** The only demographic figures available are InsightFace's, measured at a different operating point on a different kind of image.
- **Independent laboratory evaluation.** The models have not been submitted to NIST FRTE (formerly FRVT) and no accredited laboratory has evaluated Private FaceMatch.
- **Presentation attack detection.** No ISO/IEC 30107-3 evaluation and no APCER/BPCER figures.
- **Confidence intervals.** None of the published figures come with uncertainty estimates.
- **Benchmarks on the 8-bit file.** The quantisation evidence is from studies of the same architecture trained on a different dataset.

ZKPassport recommends that integrators with regulatory obligations:

1. Treat the figures on this page as a description of the model, not as a guarantee of a pass rate for their user base.
2. Run a pilot on their own population and record completion and retry rates per document type and, where lawful, per demographic group.
3. Keep a fallback path (such as a manual review or an alternative verification method) for users who cannot complete a FaceMatch.

## Data handling

Camera frames, the chip photo and both faceprints stay on the phone. They are processed in memory and discarded when the scan ends. None of them are sent to ZKPassport, to the integrator, or to any third party.

What the phone keeps, to allow the 30-day reuse, is the signed outcome: the final score, the threshold, a hash of the chip photo and a hash of the reference faceprint. It contains no image and no faceprint and never leaves the device. Removing the ID from the app deletes it.

If the user has opted into diagnostic reporting in the app, a completed or cancelled scan sends ZKPassport an event with timing, the number of frames, summary statistics of the scores and head pose (mean, minimum, maximum, standard deviation), and the device model and OS version. No image, faceprint or document data is included. Users who did not opt in send nothing.

## What the verifier receives

Your server receives a zero-knowledge proof and, once verified, `result.facematch.passed`. The proof makes that boolean trustworthy without revealing anything else:

- The scan outcome is signed by a hardware-backed key through **Apple App Attest** (iOS) or **Android Key Attestation and Google Play Integrity** (Android). The proof verifies the certificate chain back to Apple's or Google's root, so the attestation can only come from a genuine, unmodified ZKPassport app on a device those services vouch for. The app refuses to run a FaceMatch on devices that cannot attest; see [Limitations](./limitations#facematch-support).
- The signed data covers the final score, the threshold and the hash of the chip photo. The proof checks that the chip photo hash is the one covered by the document signature verified in the same proof set, so a result cannot be re-presented for a different document.
- The proof also checks that the attestation was issued for ZKPassport's app identifier in the production environment, and that the document has not expired.

The proof does not re-evaluate the face comparison. The comparison happens inside the attested app, and an attestation is only produced for a scan that completed successfully.

## Questionnaire summary

A condensed set of answers in the order most provider questionnaires ask for them.

| Item | Answer |
| --- | --- |
| Identification (1:N) metrics: FPIR, FNIR, gallery size | Not applicable. Private FaceMatch is a 1:1 verification with no gallery |
| Matching score range and direction | Cosine similarity, −1 to 1, higher is more similar |
| Match acceptance rule | Frame counts if score is strictly greater than 0.50; 10 matching frames complete the scan; their mean is recorded |
| Default threshold | 0.50, fixed, not configurable |
| Threshold selection method | Set by ZKPassport; not tuned per integrator |
| Template extraction algorithms | One: ArcFace IResNet-50 (`w600k_r50`), 512-dimensional. No alternative modes |
| Processing performance | Runs at camera frame rate on supported phones; no published latency figures |
| Template compatibility | Not applicable. No templates are stored or exchanged |
| Evaluation datasets | InsightFace's published benchmarks (LFW, CFP-FP, AgeDB-30, IJB-C) and its private MR set; no ZKPassport-run evaluation |
| Evaluation sample sizes | See the tables above |
| Demographic coverage | MR set: African, Caucasian, South Asian, East Asian; see the table above |
| Enrollment image requirements | The ICAO 9303 portrait on the ID chip; nothing is enrolled by the user |
| Probe image requirements | Live camera frames at 640×480; a face must be detected with score at least 0.3 |
| Quality filtering | Frames with no detected face or a score at or below 0.50 are not counted |
| Failed detections | Not counted; the scan continues until it completes or times out after 60 seconds |
| Statistical uncertainty | Not available |
| Liveness type | Active head-movement challenge combined with per-frame matching against the ID photo |
| Liveness score range and threshold | None; challenge completion is binary |
| Passive PAD model | None |
| PAD evaluation (ISO/IEC 30107-3) | Not performed |
| Independent testing | None |
| Result reuse | 30 days per ID |

## Glossary

| Term | Meaning |
| --- | --- |
| FMR / FAR | False Match Rate / False Accept Rate: share of impostor comparisons wrongly accepted |
| FNMR / FRR | False Non-Match Rate / False Reject Rate: share of genuine comparisons wrongly rejected |
| TAR | True Accept Rate: 1 − FNMR |
| FPIR / FNIR | False Positive / False Negative Identification Rate: the 1:N equivalents of FMR and FNMR, not applicable here |
| PAD | Presentation Attack Detection: detecting photos, screens, masks and similar spoofs |
| APCER / BPCER | Attack Presentation / Bona Fide Presentation Classification Error Rate, the ISO/IEC 30107-3 equivalents of FAR and FRR for liveness |
| Faceprint | The 512-number vector a recognition model produces for a face; also called a template or embedding |

## References

- InsightFace model zoo: [python-package/docs/model_zoo.md](https://github.com/deepinsight/insightface/blob/master/python-package/docs/model_zoo.md)
- InsightFace Recognition Test, MR set description: [challenges/iccv21-mfr](https://github.com/deepinsight/insightface/tree/master/challenges/iccv21-mfr)
- Deng et al., *ArcFace: Additive Angular Margin Loss for Deep Face Recognition*, CVPR 2019: [arXiv:1801.07698](https://arxiv.org/abs/1801.07698)
- Guo et al., *Sample and Computation Redistribution for Efficient Face Detection*, ICLR 2022: [arXiv:2105.04714](https://arxiv.org/abs/2105.04714)
- Boutros et al., *QuantFace: Towards Lightweight Face Recognition by Synthetic Data Low-bit Quantization*, ICPR 2022: [arXiv:2206.10526](https://arxiv.org/abs/2206.10526)
- Neto et al., *Compressed Models Decompress Race Biases: What Quantized Models Forget for Fair Face Recognition*, BIOSIG 2023: [arXiv:2308.11840](https://arxiv.org/abs/2308.11840)
- ISO/IEC 19795-1 (biometric performance testing) and ISO/IEC 30107-3 (presentation attack detection testing)
