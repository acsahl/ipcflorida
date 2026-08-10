// Apple Vision OCR for the IPC Florida reading-plan sheets.
//
// Emits one JSON object per recognized line with its bounding box, so the
// caller can rebuild the sheet's column/month grid from geometry instead of
// guessing at reading order.
//
//   swiftc -O scripts/ocr_plan.swift -o /tmp/ocr_plan
//   /tmp/ocr_plan <image> [minHeightFraction] > out.json

import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
guard args.count >= 2 else {
    FileHandle.standardError.write("usage: ocr_plan <image-path>\n".data(using: .utf8)!)
    exit(2)
}

guard let image = NSImage(contentsOfFile: args[1]),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    FileHandle.standardError.write("could not load image: \(args[1])\n".data(using: .utf8)!)
    exit(1)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
// Scripture refs ("Ecc. 3:1-8", "1 Chron 29") are not dictionary words, and
// language correction actively mangles them into prose.
request.usesLanguageCorrection = false
request.recognitionLanguages = ["en-US"]
if #available(macOS 13.0, *) {
    request.revision = VNRecognizeTextRequestRevision3
}
// The plan's entries are tiny relative to the page; the default floor drops them.
request.minimumTextHeight = args.count >= 3 ? Float(args[2]) ?? 0.004 : 0.004

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
} catch {
    FileHandle.standardError.write("OCR failed: \(error)\n".data(using: .utf8)!)
    exit(1)
}

struct Line: Codable {
    let text: String
    let confidence: Float
    let x: Double, y: Double, w: Double, h: Double
}

var lines: [Line] = []
for observation in request.results ?? [] {
    guard let candidate = observation.topCandidates(1).first else { continue }
    let b = observation.boundingBox   // normalized, origin bottom-left
    lines.append(Line(
        text: candidate.string,
        confidence: candidate.confidence,
        x: Double(b.minX),
        // Flip to top-left origin so downstream row sorting is natural.
        y: Double(1 - b.maxY),
        w: Double(b.width),
        h: Double(b.height)
    ))
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
FileHandle.standardOutput.write(try! encoder.encode([
    "imageWidth": Double(cgImage.width),
    "imageHeight": Double(cgImage.height),
] as [String: Double]))
FileHandle.standardOutput.write("\n".data(using: .utf8)!)
FileHandle.standardOutput.write(try! encoder.encode(lines))
