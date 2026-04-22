ALTER TABLE `announcements`
  ADD COLUMN `sourceType` varchar(80) NULL,
  ADD COLUMN `sourceRefId` varchar(160) NULL;

CREATE UNIQUE INDEX `uniq_announcement_source` ON `announcements` (`sourceType`, `sourceRefId`, `targetAudience`);
