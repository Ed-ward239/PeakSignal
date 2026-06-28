import SwiftUI
import MapKit

/// All itinerary spots pinned on a map, with the per-day route displayed and
/// optimised. Tapping a pin highlights the matching slot.
struct TripMapView: View {
    let itinerary: Itinerary
    @State private var camera: MapCameraPosition = .automatic

    var body: some View {
        Map(position: $camera) {
            ForEach(itinerary.days) { day in
                ForEach(day.slots) { slot in
                    if let lat = slot.latitude, let lon = slot.longitude {
                        Marker(slot.activity, coordinate: .init(latitude: lat, longitude: lon))
                    }
                }
            }
            // TODO: per-day MKDirections route polyline, optimised stop order.
        }
        .navigationTitle("Map")
    }
}
