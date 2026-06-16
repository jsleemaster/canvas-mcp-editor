use editor_core::DesignFile;

#[test]
fn sample_document_round_trips_through_json() {
    let file = DesignFile::sample();
    let json = serde_json::to_string_pretty(&file).unwrap();
    let parsed: DesignFile = serde_json::from_str(&json).unwrap();

    assert_eq!(parsed, file);
    assert_eq!(parsed.node_count(), 2);
}

#[test]
fn component_document_round_trips_through_json() {
    let mut file = DesignFile::sample();
    file.apply_command(editor_core::Command::CreateComponent {
        node_id: "frame-1".to_string(),
        component_id: "component-1".to_string(),
        name: "Card".to_string(),
    })
    .unwrap();
    file.apply_command(editor_core::Command::CreateComponentInstance {
        parent_id: "page-1".to_string(),
        definition_id: "component-1".to_string(),
        instance_id: "instance-1".to_string(),
        x: 480.0,
        y: 120.0,
    })
    .unwrap();

    let json = serde_json::to_string_pretty(&file).unwrap();
    let parsed: DesignFile = serde_json::from_str(&json).unwrap();

    assert_eq!(parsed.components.len(), 1);
    assert_eq!(parsed.components[0].id, "component-1");
    assert_eq!(parsed.components[0].variants[0].name, "Default");
    assert_eq!(parsed.pages[0].children[1].kind, editor_core::NodeKind::ComponentInstance);
    assert_eq!(
        parsed.pages[0].children[1]
            .component_instance
            .as_ref()
            .unwrap()
            .definition_id,
        "component-1"
    );
}
