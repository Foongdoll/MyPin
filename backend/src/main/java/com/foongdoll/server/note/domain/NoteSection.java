package com.foongdoll.server.note.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteSection {

    @Column(name = "section_title", length = 150)
    private String title;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
