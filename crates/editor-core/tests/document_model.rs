use editor_core::DesignFile;

#[test]
fn sample_document_round_trips_through_json() {
    let file = DesignFile::sample();
    let json = serde_json::to_string_pretty(&file).unwrap();
    let parsed: DesignFile = serde_json::from_str(&json).unwrap();

    assert_eq!(parsed, file);
    assert_eq!(parsed.node_count(), 2);
}
